/** @format */

import { ThemeProvider } from "@/components/themes/theme-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
    createRootRouteWithContext,
    Outlet,
    redirect,
    isRedirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { MyRouterContext } from "@/main";
import { isPublicRoute, isAuthorizedForRoute } from "@/lib/auth-utils";
import LoadingPage from "@/components/loading/loading-page";

const RootLayout = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
        <ThemeProvider
            storageKey="vite-ui-theme"
            defaultTheme="classclarus"
        >
            <Outlet />
        </ThemeProvider>
        <TanStackRouterDevtools position="bottom-right" />
    </GoogleOAuthProvider>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
    beforeLoad: async ({ location, context }) => {
        const pathname = location.pathname;

        // Check if route is public - if yes, allow access
        if (isPublicRoute(pathname)) {
            return;
        }

        // Check if user is authenticated
        if (!context.auth || !context.auth.user?.id) {
            // User is not authenticated - redirect to login page (/)
            throw redirect({
                to: "/",
                search: {
                    // Use the current location to power a redirect after login
                    redirect: location.href,
                },
            });
        }

        // Wait for auth to finish loading
        if (context.auth.isLoading) {
            // If still loading, we can't make authorization decisions yet
            // In practice, this should be rare, but we'll allow it to proceed
            // The component will handle the loading state
            return;
        }

        // Check if user is authorized for this route
        try {
            const isAuthorized = await isAuthorizedForRoute(
                pathname,
                context.auth
            );

            if (!isAuthorized) {
                // User is authenticated but not authorized - redirect to blocked page
                throw redirect({
                    to: "/blocked",
                });
            }
        } catch (error) {
            // Re-throw redirects (they're intentional, not errors)
            if (isRedirect(error)) {
                throw error;
            }

            // If authorization check fails for any other reason,
            // redirect to blocked page as a safety measure
            throw redirect({
                to: "/blocked",
            });
        }
    },
    component: RootLayout,
    pendingComponent: LoadingPage,
});
