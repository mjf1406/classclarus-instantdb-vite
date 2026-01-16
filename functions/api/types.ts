/** @format */

// Types for Cloudflare Pages Functions
export type Env = {
    VITE_INSTANT_APP_ID?: string;
    INSTANT_APP_ID?: string;
    VITE_INSTANT_APP_ADMIN_TOKEN?: string;
    INSTANT_ADMIN_TOKEN?: string;
    JOIN_RATE_LIMITER?: any; // Cloudflare RateLimit type - optional, checked at runtime
};

// Variables stored in Hono context via c.set()
// dbAdmin is the return type of initDbAdmin from @instantdb/admin
export type ContextVariables = {
    userId: string;
    dbAdmin: any; // ReturnType<typeof initDbAdmin> - using any to avoid circular dependency
};

export type HonoContext = {
    Bindings: Env;
    Variables: ContextVariables;
};
