/** @format */

import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
    buildClassBehaviorsQuery,
    buildClassRewardItemsQuery,
    buildClassFoldersQuery,
    buildStudentBehaviorLogsQuery,
    buildStudentRewardRedemptionsQuery,
    buildChildrenStudentDataQuery,
} from "./query-builders";
import { sanitizeExportData } from "./export-sanitization";


export function useExportUserData() {
    const { user: authUser } = useAuthContext();

    return async (): Promise<void> => {
        const userId = authUser.id;
        const userEmail = authUser.email;

    const userQuery = {
        $users: {
            $: { where: { id: userId } },
            organizations: {},
            classes: {},
            files: {},
            children: {},
            guardians: {},
            adminOrganizations: {},
            teacherOrganizations: {},
            adminClasses: {},
            teacherClasses: {},
            assistantTeacherClasses: {},
            studentClasses: {},
            guardianClasses: {},
            studentGroups: {
                class: {},
            },
            studentTeams: {
                group: {
                    class: {},
                },
            },
            behaviorLogsAsStudent: {
                behavior: {},
                class: {},
                createdBy: {},
            },
            behaviorLogsAsCreatedBy: {
                behavior: {},
                class: {},
                student: {},
            },
            rewardRedemptionsAsStudent: {
                rewardItem: {},
                class: {},
                createdBy: {},
            },
            rewardRedemptionsAsCreatedBy: {
                rewardItem: {},
                class: {},
                student: {},
            },
            studentExpectationsAsStudent: {
                expectation: {
                    class: {},
                },
                class: {},
            },
            dashboardPreferences: {
                class: {},
            },
            termsAcceptances: {},
            studentClassRoster: {
                class: {},
            },
        },
    };

    // Query organizations where user is member
    const orgsQuery = {
        organizations: {
            $: {
                where: {
                    or: [
                        { "owner.id": userId },
                        { "admins.id": userId },
                        { "orgTeachers.id": userId },
                    ],
                },
            },
            owner: {},
            admins: {},
            orgTeachers: {},
            classes: {
                owner: {},
                behaviors: {},
                rewardItems: {},
                folders: {},
            },
        },
    };

    // Query classes where user is member (includes children for guardians)
    // First get children IDs
    const userWithChildrenQuery = {
        $users: {
            $: { where: { id: userId } },
            children: {},
        },
    };

    const userWithChildrenResult = await db.queryOnce(userWithChildrenQuery);
    const userWithChildren = userWithChildrenResult.data?.$users?.[0];
    const childrenIds =
        userWithChildren?.children?.map((c: { id: string }) => c.id).filter(Boolean) || [];

    const classesQuery = {
        classes: {
            $: {
                where: {
                    or: [
                        { "owner.id": userId },
                        { "classAdmins.id": userId },
                        { "classTeachers.id": userId },
                        { "classAssistantTeachers.id": userId },
                        { "classStudents.id": userId },
                        { "classGuardians.id": userId },
                        ...(childrenIds.length > 0
                            ? [{ "classStudents.id": { $in: childrenIds } }]
                            : []),
                    ],
                },
            },
            owner: {},
            organization: {},
            classAdmins: {},
            classTeachers: {},
            classAssistantTeachers: {},
            classStudents: {},
            classGuardians: {},
            groups: {
                groupTeams: {},
            },
            classRoster: {
                student: {},
            },
            dashboardSettings: {},
        },
    };

    // Query pending members if email matches
    const pendingQuery = userEmail
        ? {
              pendingMembers: {
                  $: {
                      where: {
                          email: userEmail,
                      },
                  },
                  class: {},
              },
          }
        : null;

    // Execute main queries
    const [userDataResult, orgsDataResult, classesDataResult, pendingDataResult] = await Promise.all([
        db.queryOnce(userQuery),
        db.queryOnce(orgsQuery),
        db.queryOnce(classesQuery),
        pendingQuery ? db.queryOnce(pendingQuery) : Promise.resolve({ data: { pendingMembers: [] } }),
    ]);

    // Extract data from results
    const userData = userDataResult.data;
    const orgsData = orgsDataResult.data;
    const classesData = classesDataResult.data;
    const pendingData = pendingDataResult.data || { pendingMembers: [] };

    const classes = (classesData as { classes?: any[] })?.classes || [];
    const userDataEntity = userData?.$users?.[0] || null;

    // For each class, query behaviors, reward items, and folders
    const classDataQueries = classes.map((cls) => ({
        classId: cls.id,
        behaviors: buildClassBehaviorsQuery(cls.id),
        rewardItems: buildClassRewardItemsQuery(cls.id),
        folders: buildClassFoldersQuery(cls.id),
    }));

    const classDataResults = await Promise.all(
        classDataQueries.map(async (q) => {
            const [behaviorsResult, rewardItemsResult, foldersResult] = await Promise.all([
                db.queryOnce(q.behaviors),
                db.queryOnce(q.rewardItems),
                db.queryOnce(q.folders),
            ]);
            return {
                classId: q.classId,
                behaviors: behaviorsResult.data?.behaviors || [],
                rewardItems: rewardItemsResult.data?.reward_items || [],
                folders: foldersResult.data?.folders || [],
            };
        })
    );

    // Query user's own student data (behavior logs and redemptions for all classes)
    const userBehaviorLogsQueries = classes.map((cls) =>
        buildStudentBehaviorLogsQuery(cls.id, userId)
    );
    const userRewardRedemptionsQueries = classes.map((cls) =>
        buildStudentRewardRedemptionsQuery(cls.id, userId)
    );

    // Type assertion needed due to dynamic query structure
    // @ts-ignore - Dynamic query structure causes type inference issues
    const userBehaviorLogsResults = await Promise.all(
        userBehaviorLogsQueries.map((q) => db.queryOnce(q))
    ) as Array<{ data: any }>;
    // @ts-ignore - Dynamic query structure causes type inference issues
    const userRewardRedemptionsResults = await Promise.all(
        userRewardRedemptionsQueries.map((q) => db.queryOnce(q))
    ) as Array<{ data: any }>;

    const userBehaviorLogs = userBehaviorLogsResults.flatMap(
        (r: { data: any }) => (r.data as any)?.behavior_logs || []
    );
    const userRewardRedemptions = userRewardRedemptionsResults.flatMap(
        (r: { data: any }) => (r.data as any)?.reward_redemptions || []
    );

    // Query children's student data if user has children (for guardians)
    let childrenStudentData: {
        behaviorLogs: any[];
        rewardRedemptions: any[];
        studentExpectations: any[];
        dashboardPreferences: any[];
        classRoster: any[];
    } = {
        behaviorLogs: [],
        rewardRedemptions: [],
        studentExpectations: [],
        dashboardPreferences: [],
        classRoster: [],
    };

    if (childrenIds.length > 0) {
        // Query children's data for each class
        const childrenQueries = classes.map((cls) =>
            buildChildrenStudentDataQuery(childrenIds, cls.id)
        );

        // @ts-ignore - Dynamic query structure causes type inference issues
        const childrenResults = await Promise.all(
            childrenQueries
                .filter((q) => q !== null)
                .map((q) => db.queryOnce(q))
        ) as Array<{ data: any }>;

        childrenStudentData = {
            behaviorLogs: childrenResults.flatMap((r: { data: any }) => (r.data as any)?.behavior_logs || []),
            rewardRedemptions: childrenResults.flatMap(
                (r: { data: any }) => (r.data as any)?.reward_redemptions || []
            ),
            studentExpectations: childrenResults.flatMap(
                (r: { data: any }) => (r.data as any)?.student_expectations || []
            ),
            dashboardPreferences: childrenResults.flatMap(
                (r: { data: any }) => (r.data as any)?.studentDashboardPreferences || []
            ),
            classRoster: childrenResults.flatMap((r: { data: any }) => (r.data as any)?.class_roster || []),
        };
    }

    // Merge class data into classes
    const classesWithData = classes.map((cls) => {
        const classData = classDataResults.find((cd) => cd.classId === cls.id);
        return {
            ...cls,
            behaviors: classData?.behaviors || [],
            rewardItems: classData?.rewardItems || [],
            folders: classData?.folders || [],
        };
    });

    // Structure the export data
    const exportData = {
        exportDate: new Date().toISOString(),
        userEmail: userEmail || null,
        user: userDataEntity,
        organizations: (orgsData as { organizations?: any[] })?.organizations || [],
        classes: classesWithData,
        pendingMembers: (pendingData as { pendingMembers?: any[] })?.pendingMembers || [],
        // User's own student data
        userBehaviorLogs,
        userRewardRedemptions,
        // Children's student data (for guardians)
        childrenStudentData: childrenIds.length > 0 ? childrenStudentData : null,
    };

    // Sanitize the export data (remove security fields, sanitize other users' data, flatten references)
    const sanitizedData = sanitizeExportData(exportData, userId);

    // Convert to JSON
    const json = JSON.stringify(sanitizedData, null, 2);

    // Create blob and trigger download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `classclarus-data-export-${new Date().toISOString().split("T")[0]}--${userEmail}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    };
}
