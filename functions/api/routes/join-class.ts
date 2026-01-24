/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { AppSchema } from "../../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";
import type { HonoContext } from "../types";
import {
    getGuardianLinkTransactions,
    ensureRosterHasGuardianCode,
} from "../../../src/lib/guardian-utils";

export function createJoinClassRoute(app: Hono<HonoContext>) {
    // Use full path including /api prefix to match Cloudflare Pages routing
    app.post("/api/join/class", async (c) => {
        try {
            const dbAdmin = c.get("dbAdmin") as ReturnType<typeof initDbAdmin>;
            const userId = c.get("userId") as string;

            // Parse request body
            const body = await c.req.json();
            const code = (body.code as string)?.toUpperCase().trim();

            // Validate code format
            if (!code || code.length !== 6) {
                return c.json(
                    {
                        error: "Invalid code format",
                        message: "Code must be exactly 6 characters",
                    },
                    400
                );
            }

            // Check if code matches allowed pattern
            const allowedPattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
            if (!allowedPattern.test(code)) {
                return c.json(
                    {
                        error: "Invalid code format",
                        message: "Code contains invalid characters",
                    },
                    400
                );
            }

            // First, try to find a class by its codes
            const classQuery = {
                classes: {
                    $: {
                        where: {
                            or: [
                                { studentCode: code },
                                { teacherCode: code },
                                { guardianCode: code },
                            ],
                        },
                    },
                    owner: {},
                    organization: {},
                },
            };

            const classResult = await dbAdmin.query(classQuery);
            let classEntity = classResult.classes?.[0];
            let isRosterGuardianCode = false;
            let rosterEntity: InstaQLEntity<AppSchema, "class_roster"> | null = null;
            let studentEntity: InstaQLEntity<AppSchema, "$users"> | null = null;

            // If no class found, check if it's a roster guardian code
            if (!classEntity) {
                const rosterQuery = {
                    class_roster: {
                        $: {
                            where: {
                                guardianCode: code,
                            },
                        },
                        class: {
                            organization: {},
                        },
                        student: {},
                    },
                };

                const rosterResult = await dbAdmin.query(rosterQuery);
                rosterEntity = rosterResult.class_roster?.[0] || null;

                if (rosterEntity) {
                    isRosterGuardianCode = true;
                    classEntity = rosterEntity.class as InstaQLEntity<AppSchema, "classes"> | null;
                    studentEntity = rosterEntity.student as InstaQLEntity<AppSchema, "$users"> | null;

                    if (!classEntity || !studentEntity) {
                        return c.json(
                            {
                                error: "Invalid roster code",
                                message:
                                    "Roster entry is missing class or student information.",
                            },
                            404
                        );
                    }
                } else {
                    // Code not found as class code or roster guardian code
                    return c.json(
                        {
                            error: "Code not found",
                            message:
                                "Invalid class join code. Please check and try again.",
                        },
                        404
                    );
                }
            }

            // Determine role from which code matched
            let role: "student" | "teacher" | "guardian";
            let linkLabel: "classStudents" | "classTeachers" | "classGuardians";

            if (isRosterGuardianCode) {
                // Parent joining via roster guardian code
                role = "guardian";
                linkLabel = "classGuardians";
            } else if (classEntity.studentCode === code) {
                role = "student";
                linkLabel = "classStudents";
            } else if (classEntity.teacherCode === code) {
                role = "teacher";
                linkLabel = "classTeachers";
            } else if (classEntity.guardianCode === code) {
                role = "guardian";
                linkLabel = "classGuardians";
            } else {
                return c.json(
                    {
                        error: "Invalid code",
                        message: "Code does not match any role",
                    },
                    400
                );
            }

            // Check if user is already a member of this class
            const userClassesQuery = {
                $users: {
                    $: { where: { id: userId } },
                    studentClasses: {
                        $: { where: { id: classEntity.id } },
                    },
                    teacherClasses: {
                        $: { where: { id: classEntity.id } },
                    },
                    guardianClasses: {
                        $: { where: { id: classEntity.id } },
                    },
                    adminClasses: {
                        $: { where: { id: classEntity.id } },
                    },
                    classes: {
                        $: { where: { id: classEntity.id } },
                    },
                },
            };

            const userClassesResult = await dbAdmin.query(userClassesQuery);
            const userClassData = userClassesResult.$users?.[0];

            const isAlreadyStudent = userClassData?.studentClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classEntity.id
            );
            const isAlreadyTeacher = userClassData?.teacherClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classEntity.id
            );
            const isAlreadyGuardian = userClassData?.guardianClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classEntity.id
            );
            const isAlreadyAdmin = userClassData?.adminClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classEntity.id
            );
            const isOwner = classEntity.owner?.id === userId;

            if (
                isOwner ||
                isAlreadyAdmin ||
                isAlreadyStudent ||
                isAlreadyTeacher ||
                isAlreadyGuardian
            ) {
                return c.json(
                    {
                        error: "Already a member",
                        message: "You are already a member of this class.",
                        entityType: "class",
                        entityId: classEntity.id,
                        role,
                    },
                    409
                );
            }

            // Build transactions: add user to class with appropriate role
            const transactions = [];

            // Link parent as guardian to the student (if joining via roster guardian code)
            if (isRosterGuardianCode && studentEntity) {
                // Check if parent is already linked as guardian to this student
                const guardianCheckQuery = {
                    $users: {
                        $: { where: { id: userId } },
                        children: {
                            $: { where: { id: studentEntity.id } },
                        },
                    },
                };
                const guardianCheckResult = await dbAdmin.query(guardianCheckQuery);
                const guardianUser = guardianCheckResult.$users?.[0];
                const isAlreadyGuardianOfStudent =
                    guardianUser?.children?.some(
                        (child: InstaQLEntity<AppSchema, "$users">) =>
                            child.id === studentEntity.id
                    ) || false;

                if (!isAlreadyGuardianOfStudent) {
                    transactions.push(
                        dbAdmin.tx.$users[userId].link({
                            children: studentEntity.id,
                        })
                    );
                }
            }

            // Link user to the class
            transactions.push(
                dbAdmin.tx.classes[classEntity.id].link({
                    [linkLabel]: userId,
                })
            );

            // If student is joining, add their guardians to the class
            if (role === "student") {
                // Add their guardians to the class
                const guardianTransactions = await getGuardianLinkTransactions(
                    dbAdmin,
                    userId,
                    classEntity.id
                );
                transactions.push(...guardianTransactions);
            }

            // Execute all transactions in a single operation (all-or-nothing)
            // This links the student to the class first
            await dbAdmin.transact(transactions);

            // THEN create roster entry with guardian code (after student is linked)
            if (role === "student") {
                try {
                    await ensureRosterHasGuardianCode(dbAdmin, classEntity.id, userId);
                } catch (error) {
                    console.error(
                        `[Join Class] Error ensuring roster guardian code for student ${userId} in class ${classEntity.id}:`,
                        error
                    );
                    // Don't fail the join if code generation fails, but log it
                }
            }

            return c.json({
                success: true,
                message: `Successfully joined class as ${role}`,
                entityType: "class",
                entityId: classEntity.id,
                role,
            });
        } catch (error) {
            console.error("[Join Class Endpoint] Error:", error);
            return c.json(
                {
                    error: "Server error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "An unexpected error occurred",
                },
                500
            );
        }
    });
}
