/** @format */

// Types for Cloudflare Pages Functions
export type Env = {
    VITE_INSTANT_APP_ID?: string;
    INSTANT_APP_ID?: string;
    VITE_INSTANT_APP_ADMIN_TOKEN?: string;
    INSTANT_ADMIN_TOKEN?: string;
    JOIN_RATE_LIMITER?: RateLimit;
};

export type HonoContext = {
    Bindings: Env;
};
