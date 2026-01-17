/** @format */

import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env, HonoContext } from "./types";
import { authMiddleware, rateLimitMiddleware } from "./middleware";
import { createJoinOrganizationRoute } from "./routes/join-organization";
import { createJoinClassRoute } from "./routes/join-class";
import { createLeaveOrganizationRoute } from "./routes/leave-organization";
import { createLeaveClassRoute } from "./routes/leave-class";

const app = new Hono<HonoContext>();

// Apply auth middleware to all routes
app.use("*", authMiddleware);

// Apply rate limiting to join endpoints
// Update paths to match route paths
app.use("/api/join/organization", rateLimitMiddleware);
app.use("/api/join/class", rateLimitMiddleware);

// Apply rate limiting to leave endpoints
app.use("/api/leave/organization", rateLimitMiddleware);
app.use("/api/leave/class", rateLimitMiddleware);

// Register routes
createJoinOrganizationRoute(app);
createJoinClassRoute(app);
createLeaveOrganizationRoute(app);
createLeaveClassRoute(app);

// 404 handler for unmatched routes - returns JSON instead of plain text
app.notFound((c) => {
    // Log path information for debugging
    console.log("[404 Handler] Request path:", c.req.path);
    console.log("[404 Handler] Request URL:", c.req.url);
    console.log("[404 Handler] Request method:", c.req.method);
    console.log("[404 Handler] Raw path:", c.req.raw.path);
    
    return c.json(
        {
            error: "Not Found",
            message: `The requested endpoint ${c.req.path} was not found.`,
            debug: {
                path: c.req.path,
                url: c.req.url,
                method: c.req.method,
            },
        },
        404
    );
});

// Export handler for Cloudflare Pages Functions
// Using Hono's handle adapter for proper Pages Functions integration
export const onRequest = handle(app);
