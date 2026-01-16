/** @format */

import { initDbAdmin } from "../../src/lib/db/db-admin";
import type { Env } from "./types";
import { initRateLimiter } from "./utils/rate-limiter";

// Rate limiting middleware: 3 requests per 60 seconds per user
// Uses Upstash Redis for rate limiting
export async function rateLimitMiddleware(c: any, next: () => Promise<void>) {
    const userId = c.get("userId") as string | undefined;
    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // Get environment variables
    const env = (c.env as Env) || {};
    
    // Initialize rate limiter
    const ratelimit = initRateLimiter(env);
    
    if (!ratelimit) {
        // If rate limiter is not configured, skip rate limiting with warning
        console.warn("[Rate Limit Middleware] Upstash Redis not configured, skipping rate limit");
        return await next();
    }

    try {
        // Use Upstash rate limiting API
        // Key is the user ID to rate limit per user
        const { success, limit, remaining, reset } = await ratelimit.limit(userId);

        if (!success) {
            // Calculate retry after seconds
            const retryAfter = reset ? Math.ceil((reset - Date.now()) / 1000) : 60;
            
            return c.json(
                {
                    error: "Rate limit exceeded",
                    message: "Too many requests. Please try again in a minute.",
                },
                429,
                {
                    "Retry-After": retryAfter.toString(),
                }
            );
        }

        await next();
    } catch (error) {
        // If rate limiting fails, log error but allow request to proceed
        console.error("[Rate Limit Middleware] Error checking rate limit:", error);
        await next();
    }
}

// Auth middleware: Verify refresh_token
export async function authMiddleware(c: any, next: () => Promise<void>) {
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
