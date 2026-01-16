/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { AppSchema } from "../../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";
import type { HonoContext } from "../types";

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

            // Query for class directly by codes
            const classQuery = {
                classes: {
                    $: {
                        where: {
                            or: [
                                { studentCode: code },
                                { teacherCode: code },
                                { parentCode: code },
                            ],
                        },
                    },
                    owner: {},
                    organization: {},
                },
            };

            const classResult = await dbAdmin.query(classQuery);
            const classEntity = classResult.classes?.[0];

            if (!classEntity) {
                return c.json(
                    {
                        error: "Code not found",
                        message:
                            "Invalid class join code. Please check and try again.",
                    },
                    404
                );
            }

            // Determine role from which code matched
            let role: "student" | "teacher" | "parent";
            let linkLabel: "classStudents" | "classTeachers" | "classParents";

            if (classEntity.studentCode === code) {
                role = "student";
                linkLabel = "classStudents";
            } else if (classEntity.teacherCode === code) {
                role = "teacher";
                linkLabel = "classTeachers";
            } else if (classEntity.parentCode === code) {
                role = "parent";
                linkLabel = "classParents";
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
                    parentClasses: {
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
            const isAlreadyParent = userClassData?.parentClasses?.some(
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
                isAlreadyParent
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

            // Add user to class with appropriate role
            await dbAdmin.transact([
                dbAdmin.tx.classes[classEntity.id].link({
                    [linkLabel]: userId,
                }),
            ]);

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
