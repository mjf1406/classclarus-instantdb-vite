/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { AppSchema } from "../../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";
import type { HonoContext } from "../types";

export function createDeleteAccountRoute(app: Hono<HonoContext>) {
    app.post("/api/user/delete-account", async (c) => {
        try {
            const dbAdmin = c.get("dbAdmin") as ReturnType<typeof initDbAdmin>;
            const userId = c.get("userId") as string;

            if (!userId) {
                return c.json(
                    {
                        error: "Unauthorized",
                        message: "User ID is required",
                    },
                    401
                );
            }

            console.log(`[Delete Account] Starting deletion for user: ${userId}`);

            // Step 1: Query all user relationships
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
                },
            };

            const userResult = await dbAdmin.query(userQuery);
            const user = userResult.$users?.[0];

            if (!user) {
                return c.json(
                    {
                        error: "User not found",
                        message: "The user account does not exist.",
                    },
                    404
                );
            }

            const transactions: any[] = [];

            // Step 2: Query orphaned records
            // Behavior logs where user is student or createdBy
            const behaviorLogsQuery = {
                behavior_logs: {
                    $: {
                        where: {
                            or: [{ "student.id": userId }, { "createdBy.id": userId }],
                        },
                    },
                },
            };
            const behaviorLogsResult = await dbAdmin.query(behaviorLogsQuery);
            const behaviorLogs = behaviorLogsResult.behavior_logs || [];

            // Reward redemptions where user is student or createdBy
            const rewardRedemptionsQuery = {
                reward_redemptions: {
                    $: {
                        where: {
                            or: [{ "student.id": userId }, { "createdBy.id": userId }],
                        },
                    },
                },
            };
            const rewardRedemptionsResult = await dbAdmin.query(rewardRedemptionsQuery);
            const rewardRedemptions = rewardRedemptionsResult.reward_redemptions || [];

            // Student expectations
            const studentExpectationsQuery = {
                student_expectations: {
                    $: {
                        where: {
                            "student.id": userId,
                        },
                    },
                },
            };
            const studentExpectationsResult = await dbAdmin.query(studentExpectationsQuery);
            const studentExpectations = studentExpectationsResult.student_expectations || [];

            // Class roster entries
            const classRosterQuery = {
                class_roster: {
                    $: {
                        where: {
                            "student.id": userId,
                        },
                    },
                },
            };
            const classRosterResult = await dbAdmin.query(classRosterQuery);
            const classRosterEntries = classRosterResult.class_roster || [];

            // Dashboard preferences
            const dashboardPreferencesQuery = {
                studentDashboardPreferences: {
                    $: {
                        where: {
                            "user.id": userId,
                        },
                    },
                },
            };
            const dashboardPreferencesResult = await dbAdmin.query(dashboardPreferencesQuery);
            const dashboardPreferences = dashboardPreferencesResult.studentDashboardPreferences || [];

            // Terms acceptances
            const termsAcceptancesQuery = {
                terms_acceptances: {
                    $: {
                        where: {
                            "user.id": userId,
                        },
                    },
                },
            };
            const termsAcceptancesResult = await dbAdmin.query(termsAcceptancesQuery);
            const termsAcceptances = termsAcceptancesResult.terms_acceptances || [];

            // Pending members (if email matches)
            const userEmail = user.email;
            const pendingMembersQuery = userEmail
                ? {
                      pendingMembers: {
                          $: {
                              where: {
                                  email: userEmail,
                              },
                          },
                      },
                  }
                : null;
            const pendingMembersResult = pendingMembersQuery
                ? await dbAdmin.query(pendingMembersQuery)
                : { pendingMembers: [] };
            const pendingMembers = pendingMembersResult.pendingMembers || [];

            console.log(`[Delete Account] Found ${behaviorLogs.length} behavior logs, ${rewardRedemptions.length} redemptions, ${studentExpectations.length} expectations, ${classRosterEntries.length} roster entries`);

            // Step 3: Unlink all many-to-many relationships
            const unlinkData: Record<string, string[]> = {};

            // Collect all class IDs to unlink
            const classIdsToUnlink: string[] = [];
            if (user.adminClasses) {
                classIdsToUnlink.push(...user.adminClasses.map((c) => c.id));
            }
            if (user.teacherClasses) {
                classIdsToUnlink.push(...user.teacherClasses.map((c) => c.id));
            }
            if (user.assistantTeacherClasses) {
                classIdsToUnlink.push(...user.assistantTeacherClasses.map((c) => c.id));
            }
            if (user.studentClasses) {
                classIdsToUnlink.push(...user.studentClasses.map((c) => c.id));
            }
            if (user.guardianClasses) {
                classIdsToUnlink.push(...user.guardianClasses.map((c) => c.id));
            }

            // Get owned class IDs to skip unlinking (will be deleted)
            const ownedClassIds = new Set(
                (user.classes || []).filter((c) => c.owner?.id === userId).map((c) => c.id)
            );

            // Unlink from classes (skip if user is owner - will be deleted)
            for (const classId of classIdsToUnlink) {
                if (ownedClassIds.has(classId)) {
                    continue; // Skip - will be deleted
                }

                const classQuery = {
                    classes: {
                        $: { where: { id: classId } },
                        owner: {},
                        classAdmins: {},
                        classTeachers: {},
                        classAssistantTeachers: {},
                        classStudents: {},
                        classGuardians: {},
                    },
                };
                const classResult = await dbAdmin.query(classQuery);
                const classEntity = classResult.classes?.[0];

                if (classEntity && classEntity.owner?.id !== userId) {
                    if (classEntity.classAdmins?.some((a) => a.id === userId)) {
                        transactions.push(
                            dbAdmin.tx.classes[classId].unlink({
                                classAdmins: userId,
                            })
                        );
                    }
                    if (classEntity.classTeachers?.some((t) => t.id === userId)) {
                        transactions.push(
                            dbAdmin.tx.classes[classId].unlink({
                                classTeachers: userId,
                            })
                        );
                    }
                    if (classEntity.classAssistantTeachers?.some((at) => at.id === userId)) {
                        transactions.push(
                            dbAdmin.tx.classes[classId].unlink({
                                classAssistantTeachers: userId,
                            })
                        );
                    }
                    if (classEntity.classStudents?.some((s) => s.id === userId)) {
                        transactions.push(
                            dbAdmin.tx.classes[classId].unlink({
                                classStudents: userId,
                            })
                        );
                    }
                    if (classEntity.classGuardians?.some((g) => g.id === userId)) {
                        transactions.push(
                            dbAdmin.tx.classes[classId].unlink({
                                classGuardians: userId,
                            })
                        );
                    }
                }
            }

            // Get owned org IDs to skip unlinking (will be deleted)
            const ownedOrgIds = new Set(
                (user.organizations || []).filter((o) => o.owner?.id === userId).map((o) => o.id)
            );

            // Collect all org IDs to unlink
            const orgIdsToUnlink: string[] = [];
            if (user.adminOrganizations) {
                orgIdsToUnlink.push(...user.adminOrganizations.map((o) => o.id));
            }
            if (user.teacherOrganizations) {
                orgIdsToUnlink.push(...user.teacherOrganizations.map((o) => o.id));
            }

            // Unlink from organizations (skip if user is owner - will be deleted)
            for (const orgId of orgIdsToUnlink) {
                if (ownedOrgIds.has(orgId)) {
                    continue; // Skip - will be deleted
                }

                const orgQuery = {
                    organizations: {
                        $: { where: { id: orgId } },
                        owner: {},
                        admins: {},
                        orgTeachers: {},
                    },
                };
                const orgResult = await dbAdmin.query(orgQuery);
                const orgEntity = orgResult.organizations?.[0];

                if (orgEntity && orgEntity.owner?.id !== userId) {
                    if (orgEntity.admins?.some((a) => a.id === userId)) {
                        transactions.push(
                            dbAdmin.tx.organizations[orgId].unlink({
                                admins: userId,
                            })
                        );
                    }
                    if (orgEntity.orgTeachers?.some((t) => t.id === userId)) {
                        transactions.push(
                            dbAdmin.tx.organizations[orgId].unlink({
                                orgTeachers: userId,
                            })
                        );
                    }
                }
            }

            // Unlink from groups
            if (user.studentGroups) {
                for (const group of user.studentGroups) {
                    transactions.push(
                        dbAdmin.tx.groups[group.id].unlink({
                            groupStudents: userId,
                        })
                    );
                }
            }

            // Unlink from teams
            if (user.studentTeams) {
                for (const team of user.studentTeams) {
                    transactions.push(
                        dbAdmin.tx.teams[team.id].unlink({
                            teamStudents: userId,
                        })
                    );
                }
            }

            // Unlink guardian relationships
            if (user.children) {
                for (const child of user.children) {
                    transactions.push(
                        dbAdmin.tx.$users[child.id].unlink({
                            guardians: userId,
                        })
                    );
                }
            }
            if (user.guardians) {
                for (const guardian of user.guardians) {
                    transactions.push(
                        dbAdmin.tx.$users[guardian.id].unlink({
                            children: userId,
                        })
                    );
                }
            }

            // Step 4: Delete orphaned records
            for (const log of behaviorLogs) {
                transactions.push(dbAdmin.tx.behavior_logs[log.id].delete());
            }

            for (const redemption of rewardRedemptions) {
                transactions.push(dbAdmin.tx.reward_redemptions[redemption.id].delete());
            }

            for (const expectation of studentExpectations) {
                transactions.push(dbAdmin.tx.student_expectations[expectation.id].delete());
            }

            for (const roster of classRosterEntries) {
                transactions.push(dbAdmin.tx.class_roster[roster.id].delete());
            }

            for (const preference of dashboardPreferences) {
                transactions.push(dbAdmin.tx.studentDashboardPreferences[preference.id].delete());
            }

            for (const acceptance of termsAcceptances) {
                transactions.push(dbAdmin.tx.terms_acceptances[acceptance.id].delete());
            }

            for (const pending of pendingMembers) {
                transactions.push(dbAdmin.tx.pendingMembers[pending.id].delete());
            }

            // Step 5: Delete owned entities (cascade will handle related data)
            // Organizations (if owner) - cascade deletes classes
            if (user.organizations) {
                for (const org of user.organizations) {
                    if (org.owner?.id === userId) {
                        transactions.push(dbAdmin.tx.organizations[org.id].delete());
                    }
                }
            }

            // Classes (if owner) - cascade deletes related data
            if (user.classes) {
                for (const cls of user.classes) {
                    if (cls.owner?.id === userId) {
                        transactions.push(dbAdmin.tx.classes[cls.id].delete());
                    }
                }
            }

            // Files (if owner) - cascade deletes
            if (user.files) {
                for (const file of user.files) {
                    transactions.push(dbAdmin.tx.$files[file.id].delete());
                }
            }

            // Step 6: Delete user record
            transactions.push(dbAdmin.tx.$users[userId].delete());

            console.log(`[Delete Account] Executing ${transactions.length} transactions`);

            // Execute all transactions in batches to avoid overwhelming the system
            const BATCH_SIZE = 100;
            for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
                const batch = transactions.slice(i, i + BATCH_SIZE);
                await dbAdmin.transact(batch);
            }

            console.log(`[Delete Account] Successfully deleted account for user: ${userId}`);

            return c.json({
                success: true,
                message: "Account and all associated data have been deleted successfully",
            });
        } catch (error) {
            console.error("[Delete Account] Error:", error);
            return c.json(
                {
                    error: "Server error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "An unexpected error occurred while deleting the account",
                },
                500
            );
        }
    });
}
