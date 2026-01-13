<!-- @format -->

# ClassClarus

Gamify your classroom to motivate your students.

- Frontend: React with Vite `@vitejs/plugin-react`
- Router: TanStack Router `@tanstack/react-router`
- Backend: Hono with Cloudflare Pages Functions `functions/api/[[route]].ts`
- Database: InstantDB `@instantdb/react`
- UI Framework: Shadcn `@base-ui/react`
- CSS Framework: Tailwind `@tailwindcss/vite`

## Links

1. [Shadcn Project](https://ui.shadcn.com/create?base=radix&style=nova&baseColor=stone&theme=emerald&iconLibrary=lucide&font=noto-sans&menuAccent=bold&menuColor=default&radius=medium&item=preview)
2. [Polar w/ Hono](https://polar.sh/docs/integrate/sdk/adapters/hono)
3. [TanStack Router File Naming](https://tanstack.com/router/latest/docs/framework/react/routing/file-naming-conventions)
4. [TanStack Router Directory Routes](https://tanstack.com/router/latest/docs/framework/react/routing/file-naming-conventions)

## Change Log

### 2026/01/13

- UI: more mobile UI improvements
- DX: added useOrganizationById hook
- DX: added useOrganizationsByUserId hook
- UX: improved mobile UI

### 2026/01/12

- UX: icons for org icon causing too large of a bundle size so removed
- UX: added created and updated to `org-card.tsx` and `org-row.tsx`
- UI: org icon can be emoji, image, or icon.
- UI: /organizations page is good to go.

### 2026/01/11

- UI: root page is good to go.

### 2026/01/10

- DX: added auth components and provider
- UX: theme switching is very fast now and all working well
- UI: created the theme-switcher component
- DX: initialized Shadcn
- DX: initialized Tailwind
- DX: initialized InstantDB
