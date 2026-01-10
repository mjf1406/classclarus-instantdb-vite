---
name: Polar Payment Integration
overview: Integrate Polar subscriptions into your Vite + InstantDB app using Cloudflare Pages Functions with Hono. The backend will handle checkout redirects, customer portal, and webhooks that sync subscription state to InstantDB.
todos:
    - id: install-deps
      content: Install hono, @polar-sh/sdk, and @polar-sh/hono packages
      status: pending
    - id: create-handler
      content: Create functions/api/[[route]].ts with Hono router for checkout, portal, and webhooks
      status: pending
    - id: env-vars
      content: Document required environment variables for Cloudflare Pages dashboard
      status: pending
    - id: client-helpers
      content: Add helper functions/components for initiating checkout and portal from React app
      status: pending
---

<!-- @format -->

# Polar Payment Integration Plan

## Architecture Overview

```mermaid
flowchart LR
    subgraph client [Client - Vite React App]
        UI[User clicks Subscribe]
    end

    subgraph cf [Cloudflare Pages]
        Static[Static Assets]
        subgraph funcs [Functions - Hono]
            Checkout[/api/checkout]
            Portal[/api/portal]
            Webhooks[/api/webhooks]
        end
    end

    subgraph external [External Services]
        Polar[Polar]
        InstantDB[(InstantDB)]
    end

    UI -->|GET /api/checkout| Checkout
    Checkout -->|Redirect| Polar
    Polar -->|User pays| Polar
    Polar -->|POST webhook| Webhooks
    Webhooks -->|Update user subscription| InstantDB
    UI -->|GET /api/portal| Portal
    Portal -->|Redirect| Polar
```

## Project Structure

Add a `functions/` folder at the project root for Cloudflare Pages Functions:

```
classclarus-instantdb-vite/
├── functions/
│   └── api/
│       └── [[route]].ts    # Hono catch-all route
├── src/                     # Existing Vite app
├── package.json
└── wrangler.toml           # Optional: for local dev
```

## Implementation Steps

### 1. Install Dependencies

```bash
npm install hono @polar-sh/sdk @polar-sh/hono
```

### 2. Create Hono API Handler

Create [`functions/api/[[route]].ts`](functions/api/[[route]].ts) - the `[[route]] `syntax is a Cloudflare Pages catch-all that forwards all `/api/*` requests to Hono.

The handler will include:

-   **GET `/api/checkout`** - Redirects to Polar checkout with `productId` and optional `customerEmail` query params
-   **GET `/api/portal`** - Redirects to Polar customer portal for subscription management
-   **POST `/api/webhooks`** - Receives Polar webhooks and updates InstantDB

### 3. Webhook Handler Logic

When Polar sends webhook events, update the user in InstantDB:

| Polar Event | Action |

| ----------------------- | ---------------------------------------------------- |

| `subscription.created` | Set `polarCustomerId`, `polarSubscriptionId`, `plan` |

| `subscription.updated` | Update `plan` status |

| `subscription.canceled` | Set `plan` to `"canceled"` or `"free"` |

Use `@instantdb/admin` in the webhook handler to update users by their email (which Polar provides in the webhook payload).

### 4. Environment Variables

Configure these in Cloudflare Pages dashboard (Settings > Environment variables):

| Variable | Description |

| ---------------------- | --------------------------------- |

| `POLAR_ACCESS_TOKEN` | Your Polar API access token |

| `POLAR_WEBHOOK_SECRET` | Webhook signing secret from Polar |

| `POLAR_MODE` | `sandbox` or `production` |

| `INSTANT_APP_ID` | Your InstantDB app ID |

| `INSTANT_ADMIN_TOKEN` | Your InstantDB admin token |

### 5. Configure Polar Webhook

In your Polar dashboard, add a webhook endpoint:

-   URL: `https://your-domain.pages.dev/api/webhooks`
-   Events: `subscription.created`, `subscription.updated`, `subscription.canceled`

### 6. Client-Side Usage

From your React app, redirect users to checkout:

```tsx
// Simple redirect to checkout
const handleSubscribe = (productId: string) => {
    const params = new URLSearchParams({
        productId,
        customerEmail: user.email, // Optional: pre-fill email
    });
    window.location.href = `/api/checkout?${params}`;
};

// Open customer portal
const handleManageSubscription = () => {
    window.location.href = `/api/portal?email=${user.email}`;
};
```

### 7. Local Development (Optional)

For local testing, you can use `wrangler pages dev`:

```bash
npx wrangler pages dev dist --compatibility-date=2024-01-01
```

Or add to package.json scripts:

```json
"dev:functions": "wrangler pages dev dist"
```

## Key Files to Create

| File | Purpose |

| ---------------------------- | ------------------------------------ |

| `functions/api/[[route]].ts` | Hono router with all Polar endpoints |

| `wrangler.toml` (optional) | Local dev configuration |

## Your Existing Schema

Your `$users` entity already has the necessary fields:

-   `polarCustomerId` - stores Polar customer ID
-   `polarSubscriptionId` - stores active subscription ID
-   `plan` - stores subscription plan type

The webhook handler will update these fields when subscription events occur.
