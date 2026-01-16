/** @format */

import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import type { Env, HonoContext } from "./types";
import { authMiddleware, rateLimitMiddleware } from "./middleware";
import { createJoinOrganizationRoute } from "./routes/join-organization";
import { createJoinClassRoute } from "./routes/join-class";

const app = new Hono<HonoContext>();

// Apply auth middleware to all routes
app.use("*", authMiddleware);

// Apply rate limiting to join endpoints
app.use("/join/organization", rateLimitMiddleware);
app.use("/join/class", rateLimitMiddleware);

// Register routes
createJoinOrganizationRoute(app);
createJoinClassRoute(app);

// 404 handler for unmatched routes - returns JSON instead of plain text
app.notFound((c) => {
    return c.json(
        {
            error: "Not Found",
            message: `The requested endpoint ${c.req.path} was not found.`,
        },
        404
    );
});

// Export handler for Cloudflare Pages Functions
// Using Hono's handle adapter for proper Pages Functions integration
export const onRequest = handle(app);
