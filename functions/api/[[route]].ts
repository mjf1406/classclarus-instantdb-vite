/** @format */

import { Hono } from "hono";
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

// Export default handler for Cloudflare Pages Functions
// Cloudflare Pages Functions pass the request and env to the handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return app.fetch(request, env);
    },
};
