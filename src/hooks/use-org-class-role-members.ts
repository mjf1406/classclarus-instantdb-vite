/** @format */

import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useMemo } from "react";

export type ClassRoleType = "classStudents" | "classTeachers" | "classAssistantTeachers" | "classGuardians";

type ClassWithRoleMembers = InstaQLEntity<
    AppSchema,
    "classes",
    {
        organization: {};
        classStudents: {};
        classTeachers: {};
        classAssistantTeachers: {};
        classGuardians: {};
    }
>;

type UserWithClasses = {
    user: InstaQLEntity<AppSchema, "$users">;
    classes: Array<{ id: string; name: string }>;
};

type ClassQueryResult = {
    classes: ClassWithRoleMembers[];
};

export function useOrgClassRoleMembers(
    orgId: string | undefined,
    roleType: ClassRoleType
) {
    const hasValidOrgId = orgId && orgId.trim() !== "";

    const classQuery = hasValidOrgId
        ? {
              classes: {
                  $: {
                      where: {
                          and: [
                              { "organization.id": orgId },
                              { archivedAt: { $isNull: true } },
                          ],
                      },
                  },
                  organization: {},
                  classStudents: {},
                  classTeachers: {},
                  classAssistantTeachers: {},
                  classGuardians: {},
              },
          }
        : null;

    const { data: classData, isLoading, error } = db.useQuery(classQuery);

    const typedClassData = (classData as ClassQueryResult | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    const aggregatedUsers = useMemo(() => {
        if (!classes.length || !hasValidOrgId) {
            return [];
        }
        const userMap = new Map<string, UserWithClasses>();

        // Iterate through all classes and collect users with the specified role
        for (const cls of classes) {
            const roleMembers = cls[roleType] || [];
            
            for (const member of roleMembers) {
                const userId = member.id;
                if (!userId) continue;

                if (!userMap.has(userId)) {
                    userMap.set(userId, {
                        user: member,
                        classes: [],
                    });
                }

                // Add this class to the user's class list
                const userEntry = userMap.get(userId)!;
                if (!userEntry.classes.find((c) => c.id === cls.id)) {
                    userEntry.classes.push({
                        id: cls.id,
                        name: cls.name,
                    });
                }
            }
        }

        // Convert map to array and sort by user name
        return Array.from(userMap.values()).sort((a, b) => {
            const aName = `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim() || a.user.email || "";
            const bName = `${b.user.firstName || ""} ${b.user.lastName || ""}`.trim() || b.user.email || "";
            return aName.localeCompare(bName);
        });
    }, [classes, roleType, hasValidOrgId]);

    return {
        users: aggregatedUsers,
        isLoading,
        error,
    };
}
