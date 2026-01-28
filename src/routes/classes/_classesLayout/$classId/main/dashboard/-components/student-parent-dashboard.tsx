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

// Utility to determine button text color based on button background color
function getButtonTextColor(hexColor: string): string {
    if (!hexColor) return "#ffffff";
    // Remove # if present
    const hex = hexColor.replace("#", "");
    // Validate hex color format (should be 6 characters)
    if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return "#ffffff";
    }
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
}

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

    // Apply personalization styles using CSS custom properties
    const dashboardStyle: React.CSSProperties = {
        "--student-text-color": preferences?.color || undefined,
        "--student-bg-color": preferences?.background || undefined,
        "--student-button-color": preferences?.buttonColor || undefined,
        "--student-card-bg": preferences?.cardBackgroundColor || undefined,
        // Calculate button text color for contrast (white for dark buttons, black for light)
        "--student-button-text-color": preferences?.buttonColor
            ? getButtonTextColor(preferences.buttonColor)
            : undefined,
        // Calculate background text color for contrast
        "--student-bg-text-color": preferences?.background
            ? getButtonTextColor(preferences.background)
            : undefined,
        // Calculate card text color for contrast
        "--student-card-text-color": preferences?.cardBackgroundColor
            ? getButtonTextColor(preferences.cardBackgroundColor)
            : undefined,
    } as React.CSSProperties;

    // Also apply background color directly to container
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
        <div className="space-y-6 student-dashboard" style={dashboardStyle}>
            {(preferences?.buttonColor || preferences?.background) && (
                <style>
                    {`
                        .student-dashboard [data-slot="tabs-list"] {
                            background-color: var(--student-bg-color) !important;
                        }
                        .student-dashboard [data-slot="tabs-trigger"] {
                            background-color: var(--student-bg-color) !important;
                            color: var(--student-bg-text-color, inherit) !important;
                        }
                        .student-dashboard [data-slot="tabs-trigger"][data-state="active"],
                        .student-dashboard [data-slot="tabs-trigger"][data-active] {
                            background-color: var(--student-button-color) !important;
                            color: var(--student-button-text-color, #ffffff) !important;
                        }
                    `}
                </style>
            )}
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
<div className="w-full mx-auto p-6">
    
            <div className="max-w-lg lg:max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                </div>
    );
}
