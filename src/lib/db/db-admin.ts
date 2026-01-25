/** @format */

// server\db-server.ts

import { init } from "@instantdb/admin";
import _schema from "@/instant.schema";

/**
 * Get environment variables for InstantDB
 * Works in both client (Vite) and server (Cloudflare Pages) contexts
 */
function getEnvVars(env?: Record<string, unknown>) {
    // In Cloudflare Pages Functions, env vars are passed via the env parameter
    // In Vite client, they come from import.meta.env
    // In Node.js, they come from process.env
    const appId =
        (env?.VITE_INSTANT_APP_ID as string) ||
        (env?.INSTANT_APP_ID as string) ||
        (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_INSTANT_APP_ID) ||
        (typeof process !== "undefined" && process.env?.VITE_INSTANT_APP_ID) ||
        (typeof process !== "undefined" && process.env?.INSTANT_APP_ID);

    const adminToken =
        (env?.VITE_INSTANT_APP_ADMIN_TOKEN as string) ||
        (env?.INSTANT_APP_ADMIN_TOKEN as string) ||
        (env?.INSTANT_ADMIN_TOKEN as string) ||
        (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_INSTANT_APP_ADMIN_TOKEN) ||
        (typeof process !== "undefined" &&
            process.env?.VITE_INSTANT_APP_ADMIN_TOKEN) ||
        (typeof process !== "undefined" &&
            process.env?.INSTANT_APP_ADMIN_TOKEN) ||
        (typeof process !== "undefined" && process.env?.INSTANT_ADMIN_TOKEN);

    if (!appId || !adminToken) {
        throw new Error(
            "Missing InstantDB configuration. Please set VITE_INSTANT_APP_ID and VITE_INSTANT_APP_ADMIN_TOKEN (or INSTANT_APP_ID and INSTANT_APP_ADMIN_TOKEN/INSTANT_ADMIN_TOKEN for server)"
        );
    }

    return { appId, adminToken };
}

/**
 * Initialize InstantDB admin client
 * @param env - Optional environment variables (for Cloudflare Pages Functions)
 */
export function initDbAdmin(env?: Record<string, unknown>) {
    const { appId, adminToken } = getEnvVars(env);
    return init({
        appId,
        adminToken,
        schema: _schema,
    });
}

// Default export for client-side usage (backwards compatibility)
// Only initialize if we're in a client context (Vite) where import.meta.env is available
// In server contexts (Cloudflare Pages), always use initDbAdmin(env) instead
let dbAdmin: ReturnType<typeof init> | null = null;

// Only initialize if we're in a client context with Vite environment variables
// Check for both import.meta.env existence and the required env vars before initializing
if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_INSTANT_APP_ID &&
    import.meta.env.VITE_INSTANT_APP_ADMIN_TOKEN
) {
    try {
        dbAdmin = initDbAdmin();
    } catch (error) {
        // If initialization fails, leave as null
        // This can happen in server contexts or if env vars are missing
        dbAdmin = null;
    }
}

export default dbAdmin;
