/** @format */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import type { Env } from "../types";

/**
 * Initialize Upstash Redis and Rate Limiter for join endpoints
 * Rate limit: 3 requests per 60 seconds per user
 */
export function initRateLimiter(env: Env): Ratelimit | null {
    const redisUrl = env.UPSTASH_REDIS_REST_URL;
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        console.warn(
            "[Rate Limiter] Upstash Redis credentials not configured. Rate limiting disabled."
        );
        return null;
    }

    try {
        // Initialize Redis client for Cloudflare Workers/Pages
        // Use explicit initialization since env structure may vary
        const redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });

        // Create rate limiter with sliding window: 3 requests per 60 seconds
        const ratelimit = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(3, "60s"),
            analytics: true,
            prefix: "@classclarus/join-ratelimit",
        });

        return ratelimit;
    } catch (error) {
        console.error("[Rate Limiter] Failed to initialize:", error);
        return null;
    }
}
