/** @format */

/**
 * Query builder functions that mirror hook queries
 * These return query objects that can be used with db.queryOnce in async functions
 */

/**
 * Build query for class behaviors with folders
 */
export function buildClassBehaviorsQuery(classId: string) {
    return {
        behaviors: {
            $: { where: { "class.id": classId } },
            class: {},
            folder: {},
        },
        folders: {
            $: { where: { "class.id": classId } },
            behaviors: {},
            rewardItems: {},
            class: {},
        },
    };
}

/**
 * Build query for class reward items with folders
 */
export function buildClassRewardItemsQuery(classId: string) {
    return {
        reward_items: {
            $: { where: { "class.id": classId } },
            class: {},
            folder: {},
        },
        folders: {
            $: { where: { "class.id": classId } },
            behaviors: {},
            rewardItems: {},
            class: {},
        },
    };
}

/**
 * Build query for class folders
 */
export function buildClassFoldersQuery(classId: string) {
    return {
        folders: {
            $: { where: { "class.id": classId } },
            behaviors: {},
            rewardItems: {},
            class: {},
        },
    };
}

/**
 * Build query for student behavior logs in a class
 */
export function buildStudentBehaviorLogsQuery(classId: string, studentId: string) {
    return {
        behavior_logs: {
            $: {
                where: {
                    and: [
                        { "class.id": classId },
                        { "student.id": studentId },
                    ],
                },
                order: { createdAt: "desc" as const },
            },
            behavior: {},
            student: {},
            createdBy: {},
            class: {},
        },
    };
}

/**
 * Build query for student reward redemptions in a class
 */
export function buildStudentRewardRedemptionsQuery(classId: string, studentId: string) {
    return {
        reward_redemptions: {
            $: {
                where: {
                    and: [
                        { "class.id": classId },
                        { "student.id": studentId },
                    ],
                },
                order: { createdAt: "desc" as const },
            },
            rewardItem: {
                folder: {},
            },
            student: {},
            createdBy: {},
            class: {},
        },
    };
}

/**
 * Build query for class behavior logs and reward redemptions
 */
export function buildClassBehaviorLogsQuery(classId: string) {
    return {
        classes: {
            $: { where: { id: classId } },
            behaviorLogs: {
                behavior: {},
                student: {},
            },
            rewardRedemptions: {
                rewardItem: {},
                student: {},
            },
        },
    };
}

/**
 * Build query for children's student data (for guardians)
 */
export function buildChildrenStudentDataQuery(
    childrenIds: string[],
    classId?: string
) {
    if (childrenIds.length === 0) {
        return null;
    }

    const baseWhere = classId
        ? {
              and: [
                  { "class.id": classId },
                  { "student.id": { $in: childrenIds } },
              ],
          }
        : {
              "student.id": { $in: childrenIds },
          };

    const baseWhereForUser = classId
        ? {
              and: [
                  { "class.id": classId },
                  { "user.id": { $in: childrenIds } },
              ],
          }
        : {
              "user.id": { $in: childrenIds },
          };

    return {
        behavior_logs: {
            $: {
                where: baseWhere,
                order: { createdAt: "desc" as const },
            },
            behavior: {},
            class: {},
            createdBy: {},
            student: {},
        },
        reward_redemptions: {
            $: {
                where: baseWhere,
                order: { createdAt: "desc" as const },
            },
            rewardItem: {},
            class: {},
            createdBy: {},
            student: {},
        },
        student_expectations: {
            $: {
                where: baseWhere,
            },
            expectation: {
                class: {},
            },
            class: {},
            student: {},
        },
        studentDashboardPreferences: {
            $: {
                where: baseWhereForUser,
            },
            class: {},
            user: {},
        },
        class_roster: {
            $: {
                where: baseWhere,
            },
            class: {},
            student: {},
        },
    };
}
