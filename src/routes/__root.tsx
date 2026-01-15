/** @format */

import { ThemeProvider } from "@/components/themes/theme-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
    createRootRouteWithContext,
    Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { MyRouterContext } from "@/main";
import LoadingPage from "@/components/loading/loading-page";

const RootLayout = () => {
    return (
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
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
    component: RootLayout,
    pendingComponent: LoadingPage,
    pendingMs: 50, // Show pending component after 50ms (instead of default 1000ms)
    pendingMinMs: 300, // Keep pending component visible for at least 300ms
});
