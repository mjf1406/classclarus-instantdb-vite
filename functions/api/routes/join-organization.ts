/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { AppSchema } from "../../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";
import type { HonoContext } from "../types";

export function createJoinOrganizationRoute(app: Hono<HonoContext>) {
    app.post("/join/organization", async (c) => {
        try {
            const dbAdmin = c.get("dbAdmin") as ReturnType<typeof initDbAdmin>;
            const userId = c.get("userId") as string;

            // Parse request body
            const body = await c.req.json();
            const code = (body.code as string)?.toUpperCase().trim();

            // Validate code format
            if (!code || code.length !== 6) {
                return c.json(
                    { error: "Invalid code format", message: "Code must be exactly 6 characters" },
                    400
                );
            }

            // Check if code matches allowed pattern
            const allowedPattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
            if (!allowedPattern.test(code)) {
                return c.json(
                    { error: "Invalid code format", message: "Code contains invalid characters" },
                    400
                );
            }

            // Query for organization join code
            const orgQuery = {
                orgJoinCodes: {
                    $: {
                        where: { code },
                    },
                    organization: {
                        owner: {},
                    },
                },
            };

            const orgResult = await dbAdmin.query(orgQuery);
            const orgJoinCode = orgResult.data?.orgJoinCodes?.[0];
            const organization = orgJoinCode?.organization;

            if (!organization) {
                return c.json(
                    { error: "Code not found", message: "Invalid organization join code. Please check and try again." },
                    404
                );
            }

            // Check if user is already a member
            const userOrgsQuery = {
                $users: {
                    $: { where: { id: userId } },
                    teacherOrganizations: {
                        $: { where: { id: organization.id } },
                    },
                    adminOrganizations: {
                        $: { where: { id: organization.id } },
                    },
                    organizations: {
                        $: { where: { id: organization.id } },
                    },
                },
            };

            const userOrgsResult = await dbAdmin.query(userOrgsQuery);
            const userData = userOrgsResult.data?.$users?.[0];

            const isAlreadyTeacher = userData?.teacherOrganizations?.some(
                (org: InstaQLEntity<AppSchema, "organizations">) => org.id === organization.id
            );
            const isAlreadyAdmin = userData?.adminOrganizations?.some(
                (org: InstaQLEntity<AppSchema, "organizations">) => org.id === organization.id
            );
            const isOwner = organization.owner?.id === userId;

            if (isOwner || isAlreadyAdmin || isAlreadyTeacher) {
                return c.json(
                    {
                        error: "Already a member",
                        message: "You are already a member of this organization.",
                        entityType: "organization",
                        entityId: organization.id,
                    },
                    409
                );
            }

            // Add user as a teacher to the organization
            await dbAdmin.transact([
                dbAdmin.tx.organizations[organization.id].link({
                    orgTeachers: userId,
                }),
            ]);

            return c.json({
                success: true,
                message: "Successfully joined organization",
                entityType: "organization",
                entityId: organization.id,
                role: "teacher",
            });
        } catch (error) {
            console.error("[Join Organization Endpoint] Error:", error);
            return c.json(
                {
                    error: "Server error",
                    message: error instanceof Error ? error.message : "An unexpected error occurred",
                },
                500
            );
        }
    });
}
