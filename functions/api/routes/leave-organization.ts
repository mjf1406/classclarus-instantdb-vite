/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { AppSchema } from "../../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";
import type { HonoContext } from "../types";

export function createLeaveOrganizationRoute(app: Hono<HonoContext>) {
    // Use full path including /api prefix to match Cloudflare Pages routing
    app.post("/api/leave/organization", async (c) => {
        try {
            const dbAdmin = c.get("dbAdmin") as ReturnType<typeof initDbAdmin>;
            const userId = c.get("userId") as string;

            // Parse request body
            const body = await c.req.json();
            const organizationId = (body.organizationId as string)?.trim();

            // Validate organizationId format
            if (!organizationId) {
                return c.json(
                    {
                        error: "Invalid request",
                        message: "organizationId is required",
                    },
                    400
                );
            }

            // Query for organization with all role relationships
            const orgQuery = {
                organizations: {
                    $: { where: { id: organizationId } },
                    owner: {},
                    admins: {},
                    orgTeachers: {},
                },
            };

            const orgResult = await dbAdmin.query(orgQuery);
            const organization = orgResult.organizations?.[0];

            if (!organization) {
                return c.json(
                    {
                        error: "Organization not found",
                        message: "The specified organization does not exist.",
                    },
                    404
                );
            }

            // Check if user is the owner (owners cannot leave)
            const isOwner = organization.owner?.id === userId;
            if (isOwner) {
                return c.json(
                    {
                        error: "Cannot leave organization",
                        message: "Organization owners cannot leave their own organization.",
                    },
                    403
                );
            }

            // Query user's roles in the organization
            const userOrgsQuery = {
                $users: {
                    $: { where: { id: userId } },
                    adminOrganizations: {
                        $: { where: { id: organizationId } },
                    },
                    teacherOrganizations: {
                        $: { where: { id: organizationId } },
                    },
                },
            };

            const userOrgsResult = await dbAdmin.query(userOrgsQuery);
            const userOrgData = userOrgsResult.$users?.[0];

            if (!userOrgData) {
                return c.json(
                    {
                        error: "User not found",
                        message: "User data could not be retrieved.",
                    },
                    404
                );
            }

            // Determine which roles the user has
            const isAdmin = userOrgData.adminOrganizations?.some(
                (org: InstaQLEntity<AppSchema, "organizations">) =>
                    org.id === organizationId
            );
            const isTeacher = userOrgData.teacherOrganizations?.some(
                (org: InstaQLEntity<AppSchema, "organizations">) =>
                    org.id === organizationId
            );

            // Check if user is a member at all
            if (!isAdmin && !isTeacher) {
                return c.json(
                    {
                        error: "Not a member",
                        message: "You are not a member of this organization.",
                    },
                    404
                );
            }

            // Build unlink data object
            const unlinkData: Record<string, string> = {};

            if (isAdmin) {
                unlinkData.adminOrganizations = organizationId;
            }
            if (isTeacher) {
                unlinkData.teacherOrganizations = organizationId;
            }

            // Unlink all user roles from the organization
            await dbAdmin.transact([
                dbAdmin.tx.$users[userId].unlink(unlinkData),
            ]);

            return c.json({
                success: true,
                message: "Successfully left organization",
                entityType: "organization",
                entityId: organizationId,
            });
        } catch (error) {
            console.error("[Leave Organization Endpoint] Error:", error);
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
