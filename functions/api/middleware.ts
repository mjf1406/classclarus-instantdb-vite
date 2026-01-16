/** @format */

import { initDbAdmin } from "../../src/lib/db/db-admin";
import type { Env } from "./types";

// Rate limiting middleware: 3 requests per minute per user
// Uses Cloudflare's built-in Rate Limiting API
export async function rateLimitMiddleware(c: any, next: () => Promise<void>) {
    const userId = c.get("userId") as string | undefined;
    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // Get the rate limiter from environment
    const rateLimiter = c.env?.JOIN_RATE_LIMITER;
    
    if (!rateLimiter) {
        // If rate limiter is not configured, skip rate limiting
        console.warn("[Rate Limit Middleware] JOIN_RATE_LIMITER not configured, skipping rate limit");
        return await next();
    }

    // Check if rate limiter has the expected API
    if (typeof rateLimiter.limit !== "function") {
        // Rate limiter exists but doesn't have the expected API, skip rate limiting
        console.warn("[Rate Limit Middleware] JOIN_RATE_LIMITER does not have limit method, skipping rate limit");
        return await next();
    }

    // Use Cloudflare's rate limiting API
    // Key is the user ID to rate limit per user
    const { success } = await rateLimiter.limit({ key: userId });

    if (!success) {
        return c.json(
            {
                error: "Rate limit exceeded",
                message: "Too many requests. Please try again in a minute.",
            },
            429
        );
    }

    await next();
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
