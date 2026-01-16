/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../src/lib/db/db-admin";
import type { AppSchema } from "../../src/instant.schema";
import type { InstaQLEntity } from "@instantdb/admin";

// Types for Cloudflare Pages Functions
type Env = {
    VITE_INSTANT_APP_ID?: string;
    INSTANT_APP_ID?: string;
    VITE_INSTANT_APP_ADMIN_TOKEN?: string;
    INSTANT_ADMIN_TOKEN?: string;
};

type HonoContext = {
    Bindings: Env;
};

const app = new Hono<HonoContext>();

// Rate limiting storage (in-memory Map)
// Key: user ID, Value: { count: number, resetAt: number }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of rateLimitMap.entries()) {
        if (data.resetAt < now) {
            rateLimitMap.delete(userId);
        }
    }
}, 5 * 60 * 1000);

// Rate limiting middleware: 3 requests per minute per user
async function rateLimitMiddleware(c: any, next: () => Promise<void>) {
    const userId = c.get("userId") as string | undefined;
    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || userLimit.resetAt < now) {
        // Reset or create new limit
        rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 1000 });
        return await next();
    }

    if (userLimit.count >= 3) {
        return c.json(
            {
                error: "Rate limit exceeded",
                message: "Too many requests. Please try again in a minute.",
            },
            429
        );
    }

    // Increment count
    userLimit.count++;
    await next();
}

// Auth middleware: Verify refresh_token
async function authMiddleware(c: any, next: () => Promise<void>) {
    // Get token from Authorization header or token header
    const authHeader = c.req.header("Authorization");
    const tokenHeader = c.req.header("token");
    const token = authHeader?.replace("Bearer ", "") || tokenHeader;

    if (!token) {
        return c.json({ error: "Missing authentication token" }, 401);
    }

    // Initialize admin DB with environment variables
    // In Cloudflare Pages, env is available via c.env
    const env = (c.env as Env) || {};
    const dbAdmin = initDbAdmin(env);

    try {
        // Verify the token
        const user = await dbAdmin.auth.verifyToken(token);
        if (!user) {
            return c.json({ error: "Invalid authentication token" }, 401);
        }

        // Store user ID in context for rate limiting and endpoint use
        c.set("userId", user.id);
        c.set("dbAdmin", dbAdmin);
        await next();
    } catch (error) {
        console.error("[Auth Middleware] Error verifying token:", error);
        return c.json(
            { error: "Authentication failed", message: error instanceof Error ? error.message : "Unknown error" },
            401
        );
    }
}

// Apply auth middleware to all routes
app.use("*", authMiddleware);

// Apply rate limiting to join endpoint
app.use("/join", rateLimitMiddleware);

// Join endpoint: POST /api/join
app.post("/join", async (c) => {
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

        // First, try to find organization join code
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

        if (organization) {
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
        }

        // If no org code found, try class join codes
        const classQuery = {
            classJoinCodes: {
                $: {
                    where: {
                        or: [
                            { studentCode: code },
                            { teacherCode: code },
                            { parentCode: code },
                        ],
                    },
                },
                class: {
                    owner: {},
                    organization: {},
                },
            },
        };

        const classResult = await dbAdmin.query(classQuery);
        const classJoinCode = classResult.data?.classJoinCodes?.[0];
        const classEntity = classJoinCode?.class;

        if (!classEntity) {
            return c.json(
                { error: "Code not found", message: "Invalid join code. Please check and try again." },
                404
            );
        }

        // Determine role from which code matched
        let role: "student" | "teacher" | "parent";
        let linkLabel: "classStudents" | "classTeachers" | "classParents";

        if (classJoinCode.studentCode === code) {
            role = "student";
            linkLabel = "classStudents";
        } else if (classJoinCode.teacherCode === code) {
            role = "teacher";
            linkLabel = "classTeachers";
        } else if (classJoinCode.parentCode === code) {
            role = "parent";
            linkLabel = "classParents";
        } else {
            return c.json({ error: "Invalid code", message: "Code does not match any role" }, 400);
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
        const userClassData = userClassesResult.data?.$users?.[0];

        const isAlreadyStudent = userClassData?.studentClasses?.some(
            (cls: InstaQLEntity<AppSchema, "classes">) => cls.id === classEntity.id
        );
        const isAlreadyTeacher = userClassData?.teacherClasses?.some(
            (cls: InstaQLEntity<AppSchema, "classes">) => cls.id === classEntity.id
        );
        const isAlreadyParent = userClassData?.parentClasses?.some(
            (cls: InstaQLEntity<AppSchema, "classes">) => cls.id === classEntity.id
        );
        const isAlreadyAdmin = userClassData?.adminClasses?.some(
            (cls: InstaQLEntity<AppSchema, "classes">) => cls.id === classEntity.id
        );
        const isOwner = classEntity.owner?.id === userId;

        if (isOwner || isAlreadyAdmin || isAlreadyStudent || isAlreadyTeacher || isAlreadyParent) {
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
        console.error("[Join Endpoint] Error:", error);
        return c.json(
            {
                error: "Server error",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            500
        );
    }
});

// Export default handler for Cloudflare Pages Functions
// Cloudflare Pages Functions pass the request and env to the handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return app.fetch(request, env);
    },
};