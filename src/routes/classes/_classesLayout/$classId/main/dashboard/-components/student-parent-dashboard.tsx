/** @format */

import { useState, useMemo, useEffect } from "react";
import { Users } from "lucide-react";
import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PointsWidget } from "./points-widget";
import { ExpectationsWidget } from "./expectations-widget";
import { RandomAssignersWidget } from "./random-assigners-widget";
import { RotatingAssignersWidget } from "./rotating-assigners-widget";
import { GroupsTeamsWidget } from "./groups-teams-widget";
import { ShufflerHistoryWidget } from "./shuffler-history-widget";
import { PickerHistoryWidget } from "./picker-history-widget";
import { AttendanceWidget } from "./attendance-widget";
import { RazAssessmentsWidget } from "./raz-assessments-widget";

type StudentDashboardPreferences = InstaQLEntity<
    AppSchema,
    "studentDashboardPreferences",
    { class: {}; user: {} }
>;

type PreferencesQueryResult = {
    studentDashboardPreferences: StudentDashboardPreferences[];
};

type UserQueryResult = {
    $users: Array<InstaQLEntity<AppSchema, "$users", { children: {} }>>;
};

type ClassDashboardSettings = InstaQLEntity<AppSchema, "classDashboardSettings", { class?: {} }>;

type DashboardSettingsQueryResult = {
    classDashboardSettings: ClassDashboardSettings[];
};

interface StudentParentDashboardProps {
    classId: string;
    isGuardian: boolean;
}

export function StudentParentDashboard({
    classId,
    isGuardian,
}: StudentParentDashboardProps) {
    const { user } = useAuthContext();
    const userId = user?.id;

    // For guardians, we need to select which child to view
    const [selectedChildId, setSelectedChildId] = useState<string>("");

    // For guardians: query children in this class
    const { data: userData } = db.useQuery(
        isGuardian && userId
            ? {
                  $users: {
                      $: { where: { id: userId } },
                      children: {},
                  },
              }
            : null
    );

    const typedUserData = (userData as UserQueryResult | undefined) ?? null;
    const guardianUser = typedUserData?.$users?.[0];
    const allChildren = guardianUser?.children || [];

    // Query class students to filter children who are in this class
    const { data: classData } = db.useQuery(
        classId
            ? {
                  classes: {
                      $: { where: { id: classId } },
                      classStudents: {},
                  },
              }
            : null
    );

    const classStudents =
        (classData as { classes?: Array<{ classStudents?: Array<{ id: string }> }> } | undefined)
            ?.classes?.[0]?.classStudents || [];

    const classStudentIds = new Set(classStudents.map((s) => s.id));

    // Filter children who are students in this class
    const childrenInClass = useMemo(() => {
        return allChildren.filter((child) => classStudentIds.has(child.id));
    }, [allChildren, classStudentIds]);

    // Set default selected child for guardians
    useEffect(() => {
        if (isGuardian && childrenInClass.length > 0 && !selectedChildId) {
            setSelectedChildId(childrenInClass[0].id);
        }
    }, [isGuardian, childrenInClass, selectedChildId]);

    // Determine which student ID to use for widget display
    const studentIdForWidget = isGuardian ? selectedChildId : userId || "";

    // Query student preferences for the selected student
    const { data: prefsData } = db.useQuery(
        studentIdForWidget && classId
            ? {
                  studentDashboardPreferences: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "user.id": studentIdForWidget },
                              ],
                          },
                      },
                      class: {},
                      user: {},
                  },
              }
            : null
    );

    const typedPrefsData = (prefsData as PreferencesQueryResult | undefined) ?? null;
    const preferences = typedPrefsData?.studentDashboardPreferences?.[0];

    // Query class dashboard settings to check if points widget is enabled
    const { data: settingsData } = db.useQuery(
        classId
            ? {
                  classDashboardSettings: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                  },
              }
            : null
    );

    const typedSettingsData = (settingsData as DashboardSettingsQueryResult | undefined) ?? null;
    const existingSettings = typedSettingsData?.classDashboardSettings?.[0];
    const showPointsWidget = existingSettings?.showPointsWidget ?? false;
    const showExpectationsWidget = existingSettings?.showExpectationsWidget ?? false;
    const showRandomAssignersWidget = existingSettings?.showRandomAssignersWidget ?? false;
    const showRotatingAssignersWidget = existingSettings?.showRotatingAssignersWidget ?? false;
    const showGroupsTeamsWidget = existingSettings?.showGroupsTeamsWidget ?? false;
    const showShufflerHistoryWidget = existingSettings?.showShufflerHistoryWidget ?? false;
    const showPickerHistoryWidget = existingSettings?.showPickerHistoryWidget ?? false;
    const showAttendanceWidget = existingSettings?.showAttendanceWidget ?? false;
    const showRazAssessmentsWidget = existingSettings?.showRazAssessmentsWidget ?? false;

    // Parse selected assigner IDs - return empty array if empty, null if not set
    const selectedRandomAssignerIds = useMemo(() => {
        if (!existingSettings?.selectedRandomAssignerIds) return null;
        try {
            const parsed = JSON.parse(existingSettings.selectedRandomAssignerIds);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }, [existingSettings?.selectedRandomAssignerIds]);

    const selectedRotatingAssignerIds = useMemo(() => {
        if (!existingSettings?.selectedRotatingAssignerIds) return null;
        try {
            const parsed = JSON.parse(existingSettings.selectedRotatingAssignerIds);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }, [existingSettings?.selectedRotatingAssignerIds]);

    // Apply personalization styles
    const dashboardStyle: React.CSSProperties = {};
    if (preferences?.color) {
        dashboardStyle.color = preferences.color;
    }
    if (preferences?.background) {
        dashboardStyle.background = preferences.background;
    }

    if (isGuardian && childrenInClass.length === 0) {
        return (
            <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                    None of your children are students in this class.
                </p>
            </div>
        );
    }

    if (isGuardian && !selectedChildId) {
        return (
            <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                    Please select a child to view their dashboard.
                </p>
            </div>
        );
    }

    if (!studentIdForWidget) {
        return null;
    }

    return (
        <div className="space-y-6" style={dashboardStyle}>
            {isGuardian && childrenInClass.length > 0 && (
                <div className="space-y-3">
                    <Label>View Dashboard For</Label>
                    <RadioGroup
                        value={selectedChildId}
                        onValueChange={setSelectedChildId}
                        className="space-y-2"
                    >
                        {childrenInClass.map((child) => {
                            const displayName =
                                `${child.firstName || ""} ${child.lastName || ""}`.trim() ||
                                child.email ||
                                "Unknown";
                            return (
                                <div
                                    key={child.id}
                                    className="flex items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                    <RadioGroupItem
                                        value={child.id}
                                        id={`child-${child.id}`}
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label
                                            htmlFor={`child-${child.id}`}
                                            className="font-medium cursor-pointer"
                                        >
                                            {displayName}
                                        </Label>
                                    </div>
                                </div>
                            );
                        })}
                    </RadioGroup>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {showPointsWidget && studentIdForWidget && classId && (
                    <PointsWidget classId={classId} studentId={studentIdForWidget} />
                )}
                {showExpectationsWidget && studentIdForWidget && classId && (
                    <ExpectationsWidget classId={classId} studentId={studentIdForWidget} />
                )}
                {showRandomAssignersWidget && studentIdForWidget && classId && (
                    <RandomAssignersWidget
                        classId={classId}
                        studentId={studentIdForWidget}
                        selectedAssignerIds={selectedRandomAssignerIds || undefined}
                    />
                )}
                {showRotatingAssignersWidget && studentIdForWidget && classId && (
                    <RotatingAssignersWidget
                        classId={classId}
                        studentId={studentIdForWidget}
                        selectedAssignerIds={selectedRotatingAssignerIds || undefined}
                    />
                )}
                {showGroupsTeamsWidget && studentIdForWidget && classId && (
                    <GroupsTeamsWidget classId={classId} studentId={studentIdForWidget} />
                )}
                {showShufflerHistoryWidget && studentIdForWidget && classId && (
                    <ShufflerHistoryWidget classId={classId} studentId={studentIdForWidget} />
                )}
                {showPickerHistoryWidget && studentIdForWidget && classId && (
                    <PickerHistoryWidget classId={classId} studentId={studentIdForWidget} />
                )}
                {showAttendanceWidget && studentIdForWidget && classId && (
                    <AttendanceWidget classId={classId} studentId={studentIdForWidget} />
                )}
                {showRazAssessmentsWidget && studentIdForWidget && classId && (
                    <RazAssessmentsWidget classId={classId} studentId={studentIdForWidget} />
                )}
            </div>
        </div>
    );
}
