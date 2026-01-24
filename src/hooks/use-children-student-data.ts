/** @format */

import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type BehaviorLog = InstaQLEntity<
    AppSchema,
    "behavior_logs",
    {
        behavior?: {};
        class?: {};
        createdBy?: {};
        student?: {};
    }
>;

type RewardRedemption = InstaQLEntity<
    AppSchema,
    "reward_redemptions",
    {
        rewardItem?: {};
        class?: {};
        createdBy?: {};
        student?: {};
    }
>;

type StudentExpectation = InstaQLEntity<
    AppSchema,
    "student_expectations",
    {
        expectation?: { class?: {} };
        class?: {};
        student?: {};
    }
>;

type DashboardPreference = InstaQLEntity<
    AppSchema,
    "studentDashboardPreferences",
    {
        class?: {};
        user?: {};
    }
>;

type ClassRoster = InstaQLEntity<
    AppSchema,
    "class_roster",
    {
        class?: {};
        student?: {};
    }
>;

type BehaviorLogsQueryResult = {
    behavior_logs: BehaviorLog[];
};

type RewardRedemptionsQueryResult = {
    reward_redemptions: RewardRedemption[];
};

type StudentExpectationsQueryResult = {
    student_expectations: StudentExpectation[];
};

type DashboardPreferencesQueryResult = {
    studentDashboardPreferences: DashboardPreference[];
};

type ClassRosterQueryResult = {
    class_roster: ClassRoster[];
};

/**
 * Hook to fetch all student data for a guardian's children
 * Queries behavior logs, reward redemptions, expectations, preferences, and roster
 * for all children of the current user
 * @param classId - Optional class ID to filter by class
 * @returns Object containing all children's student data and isLoading state
 */
export function useChildrenStudentData(classId?: string | undefined) {
    const { user } = useAuthContext();
    const userId = user?.id;

    // Query user's children
    const userQuery = userId
        ? {
              $users: {
                  $: { where: { id: userId } },
                  children: {},
              },
          }
        : null;

    const { data: userData } = db.useQuery(userQuery);
    const children =
        (userData as { $users?: Array<{ children?: Array<{ id: string }> }> } | undefined)
            ?.$users?.[0]?.children ?? [];
    const childrenIds = children.map((c) => c.id).filter(Boolean);

    const hasChildren = childrenIds.length > 0;
    const hasValidClassId = classId && classId.trim() !== "";

    // Query behavior logs for all children
    const behaviorLogsQuery =
        hasChildren && hasValidClassId
            ? {
                  behavior_logs: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": { $in: childrenIds } },
                              ],
                          },
                          order: { createdAt: "desc" } as const,
                      },
                      behavior: {},
                      class: {},
                      createdBy: {},
                      student: {},
                  },
              }
            : hasChildren
              ? {
                    behavior_logs: {
                        $: {
                            where: {
                                "student.id": { $in: childrenIds },
                            },
                            order: { createdAt: "desc" } as const,
                        },
                        behavior: {},
                        class: {},
                        createdBy: {},
                        student: {},
                    },
                }
              : null;

    // Query reward redemptions for all children
    const rewardRedemptionsQuery =
        hasChildren && hasValidClassId
            ? {
                  reward_redemptions: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": { $in: childrenIds } },
                              ],
                          },
                          order: { createdAt: "desc" } as const,
                      },
                      rewardItem: {},
                      class: {},
                      createdBy: {},
                      student: {},
                  },
              }
            : hasChildren
              ? {
                    reward_redemptions: {
                        $: {
                            where: {
                                "student.id": { $in: childrenIds },
                            },
                            order: { createdAt: "desc" } as const,
                        },
                        rewardItem: {},
                        class: {},
                        createdBy: {},
                        student: {},
                    },
                }
              : null;

    // Query student expectations for all children
    const studentExpectationsQuery =
        hasChildren && hasValidClassId
            ? {
                  student_expectations: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": { $in: childrenIds } },
                              ],
                          },
                      },
                      expectation: { class: {} },
                      class: {},
                      student: {},
                  },
              }
            : hasChildren
              ? {
                    student_expectations: {
                        $: {
                            where: {
                                "student.id": { $in: childrenIds },
                            },
                        },
                        expectation: { class: {} },
                        class: {},
                        student: {},
                    },
                }
              : null;

    // Query dashboard preferences for all children
    const dashboardPreferencesQuery =
        hasChildren && hasValidClassId
            ? {
                  studentDashboardPreferences: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "user.id": { $in: childrenIds } },
                              ],
                          },
                      },
                      class: {},
                      user: {},
                  },
              }
            : hasChildren
              ? {
                    studentDashboardPreferences: {
                        $: {
                            where: {
                                "user.id": { $in: childrenIds },
                            },
                        },
                        class: {},
                        user: {},
                    },
                }
              : null;

    // Query class roster for all children
    const classRosterQuery =
        hasChildren && hasValidClassId
            ? {
                  class_roster: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": { $in: childrenIds } },
                              ],
                          },
                      },
                      class: {},
                      student: {},
                  },
              }
            : hasChildren
              ? {
                    class_roster: {
                        $: {
                            where: {
                                "student.id": { $in: childrenIds },
                            },
                        },
                        class: {},
                        student: {},
                    },
                }
              : null;

    const { data: behaviorLogsData, isLoading: behaviorLogsLoading } =
        db.useQuery(behaviorLogsQuery);
    const { data: rewardRedemptionsData, isLoading: redemptionsLoading } =
        db.useQuery(rewardRedemptionsQuery);
    const { data: studentExpectationsData, isLoading: expectationsLoading } =
        db.useQuery(studentExpectationsQuery);
    const { data: dashboardPreferencesData, isLoading: preferencesLoading } =
        db.useQuery(dashboardPreferencesQuery);
    const { data: classRosterData, isLoading: rosterLoading } =
        db.useQuery(classRosterQuery);

    const typedBehaviorLogs =
        (behaviorLogsData as BehaviorLogsQueryResult | undefined) ?? null;
    const behaviorLogs = typedBehaviorLogs?.behavior_logs ?? [];

    const typedRewardRedemptions =
        (rewardRedemptionsData as RewardRedemptionsQueryResult | undefined) ??
        null;
    const rewardRedemptions = typedRewardRedemptions?.reward_redemptions ?? [];

    const typedStudentExpectations =
        (studentExpectationsData as StudentExpectationsQueryResult | undefined) ??
        null;
    const studentExpectations =
        typedStudentExpectations?.student_expectations ?? [];

    const typedDashboardPreferences =
        (dashboardPreferencesData as DashboardPreferencesQueryResult | undefined) ??
        null;
    const dashboardPreferences =
        typedDashboardPreferences?.studentDashboardPreferences ?? [];

    const typedClassRoster =
        (classRosterData as ClassRosterQueryResult | undefined) ?? null;
    const classRoster = typedClassRoster?.class_roster ?? [];

    return {
        behaviorLogs,
        rewardRedemptions,
        studentExpectations,
        dashboardPreferences,
        classRoster,
        children,
        isLoading:
            behaviorLogsLoading ||
            redemptionsLoading ||
            expectationsLoading ||
            preferencesLoading ||
            rosterLoading,
    };
}
