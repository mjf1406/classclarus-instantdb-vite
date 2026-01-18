/** @format */

import { useState, useMemo, useEffect } from "react";
import { Users } from "lucide-react";
import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

        </div>
    );
}
