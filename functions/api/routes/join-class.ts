/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { AppSchema } from "../../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";
import type { HonoContext } from "../types";
import {
    getGuardianLinkTransactions,
    ensureStudentHasGuardianCode,
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
            let isStudentGuardianCode = false;
            let studentEntity: InstaQLEntity<AppSchema, "$users"> | null = null;

            // If no class found, check if it's a student guardian code
            if (!classEntity) {
                const studentQuery = {
                    $users: {
                        $: {
                            where: {
                                studentGuardianCode: code,
                            },
                        },
                        studentClasses: {
                            organization: {},
                        },
                    },
                };

                const studentResult = await dbAdmin.query(studentQuery);
                studentEntity = studentResult.$users?.[0] || null;

                if (studentEntity) {
                    isStudentGuardianCode = true;
                    const studentClasses = studentEntity.studentClasses || [];

                    // If student has no classes, return error
                    if (studentClasses.length === 0) {
                        return c.json(
                            {
                                error: "Student not in any classes",
                                message:
                                    "This student is not enrolled in any classes.",
                            },
                            404
                        );
                    }

                    // If student is in exactly one class, use that
                    if (studentClasses.length === 1) {
                        classEntity = studentClasses[0];
                    } else {
                        // Student is in multiple classes - return list for selection
                        return c.json({
                            success: false,
                            requiresClassSelection: true,
                            message:
                                "This student is enrolled in multiple classes. Please select which class(es) to join.",
                            studentId: studentEntity.id,
                            studentName: `${studentEntity.firstName || ""} ${studentEntity.lastName || ""}`.trim() || "Student",
                            classes: studentClasses.map((cls) => ({
                                id: cls.id,
                                name: cls.name,
                                organizationName: cls.organization?.name || null,
                            })),
                        });
                    }
                } else {
                    // Code not found as class code or student guardian code
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

            if (isStudentGuardianCode) {
                // Parent joining via student guardian code
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

            // Handle case where parent is joining via student guardian code with selected classes
            let classIdsToJoin: string[] = [classEntity.id];
            if (isStudentGuardianCode && body.selectedClassIds) {
                // Parent selected specific classes from the list
                const selectedIds = Array.isArray(body.selectedClassIds)
                    ? body.selectedClassIds
                    : [body.selectedClassIds];
                classIdsToJoin = selectedIds;
            }

            // Build transactions: add user to class(es) with appropriate role
            const transactions = [];

            // Link parent as guardian to the student (if joining via student code)
            if (isStudentGuardianCode && studentEntity) {
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

            // Link user to each selected class
            for (const classId of classIdsToJoin) {
                transactions.push(
                    dbAdmin.tx.classes[classId].link({
                        [linkLabel]: userId,
                    })
                );
            }

            // If student is joining, ensure they have a guardian code and add their guardians to the class
            if (role === "student") {
                // Ensure student has a guardian code
                try {
                    await ensureStudentHasGuardianCode(dbAdmin, userId);
                } catch (error) {
                    console.error(
                        `[Join Class] Error ensuring guardian code for student ${userId}:`,
                        error
                    );
                    // Don't fail the join if code generation fails
                }

                // Add their guardians to the class
                for (const classId of classIdsToJoin) {
                    const guardianTransactions =
                        await getGuardianLinkTransactions(
                            dbAdmin,
                            userId,
                            classId
                        );
                    transactions.push(...guardianTransactions);
                }
            }

            // Execute all transactions in a single operation (all-or-nothing)
            await dbAdmin.transact(transactions);

            return c.json({
                success: true,
                message: `Successfully joined class${classIdsToJoin.length > 1 ? "es" : ""} as ${role}`,
                entityType: "class",
                entityId: classIdsToJoin.length === 1 ? classIdsToJoin[0] : null,
                classIds: classIdsToJoin,
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
