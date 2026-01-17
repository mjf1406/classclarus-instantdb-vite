/** @format */

// Types for Cloudflare Pages Functions
export type Env = {
    VITE_INSTANT_APP_ID?: string;
    INSTANT_APP_ID?: string;
    VITE_INSTANT_APP_ADMIN_TOKEN?: string;
    INSTANT_ADMIN_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    GC_CLIENT?: string;
    GC_SECRET?: string;
    GC_REDIRECT_URI?: string;
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
