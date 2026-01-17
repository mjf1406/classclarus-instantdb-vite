/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { AppSchema } from "../../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";
import type { HonoContext } from "../types";

export function createLeaveClassRoute(app: Hono<HonoContext>) {
    // Use full path including /api prefix to match Cloudflare Pages routing
    app.post("/api/leave/class", async (c) => {
        try {
            const dbAdmin = c.get("dbAdmin") as ReturnType<typeof initDbAdmin>;
            const userId = c.get("userId") as string;

            // Parse request body
            const body = await c.req.json();
            const classId = (body.classId as string)?.trim();

            // Validate classId format
            if (!classId) {
                return c.json(
                    {
                        error: "Invalid request",
                        message: "classId is required",
                    },
                    400
                );
            }

            // Query for class with all role relationships
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

            if (!classEntity) {
                return c.json(
                    {
                        error: "Class not found",
                        message: "The specified class does not exist.",
                    },
                    404
                );
            }

            // Check if user is the owner (owners cannot leave)
            const isOwner = classEntity.owner?.id === userId;
            if (isOwner) {
                return c.json(
                    {
                        error: "Cannot leave class",
                        message: "Class owners cannot leave their own class.",
                    },
                    403
                );
            }

            // Query user's roles in the class
            const userClassesQuery = {
                $users: {
                    $: { where: { id: userId } },
                    adminClasses: {
                        $: { where: { id: classId } },
                    },
                    teacherClasses: {
                        $: { where: { id: classId } },
                    },
                    assistantTeacherClasses: {
                        $: { where: { id: classId } },
                    },
                    studentClasses: {
                        $: { where: { id: classId } },
                    },
                    guardianClasses: {
                        $: { where: { id: classId } },
                    },
                },
            };

            const userClassesResult = await dbAdmin.query(userClassesQuery);
            const userClassData = userClassesResult.$users?.[0];

            if (!userClassData) {
                return c.json(
                    {
                        error: "User not found",
                        message: "User data could not be retrieved.",
                    },
                    404
                );
            }

            // Determine which roles the user has
            const isAdmin = userClassData.adminClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classId
            );
            const isTeacher = userClassData.teacherClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classId
            );
            const isAssistantTeacher =
                userClassData.assistantTeacherClasses?.some(
                    (cls: InstaQLEntity<AppSchema, "classes">) =>
                        cls.id === classId
                );
            const isStudent = userClassData.studentClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classId
            );
            const isGuardian = userClassData.guardianClasses?.some(
                (cls: InstaQLEntity<AppSchema, "classes">) =>
                    cls.id === classId
            );

            // Check if user is a member at all
            if (!isAdmin && !isTeacher && !isAssistantTeacher && !isStudent && !isGuardian) {
                return c.json(
                    {
                        error: "Not a member",
                        message: "You are not a member of this class.",
                    },
                    404
                );
            }

            // Build unlink data object
            const unlinkData: Record<string, string> = {};

            if (isAdmin) {
                unlinkData.adminClasses = classId;
            }
            if (isTeacher) {
                unlinkData.teacherClasses = classId;
            }
            if (isAssistantTeacher) {
                unlinkData.assistantTeacherClasses = classId;
            }
            if (isStudent) {
                unlinkData.studentClasses = classId;
            }
            if (isGuardian) {
                unlinkData.guardianClasses = classId;
            }

            // Unlink all user roles from the class
            await dbAdmin.transact([
                dbAdmin.tx.$users[userId].unlink(unlinkData),
            ]);

            return c.json({
                success: true,
                message: "Successfully left class",
                entityType: "class",
                entityId: classId,
            });
        } catch (error) {
            console.error("[Leave Class Endpoint] Error:", error);
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
