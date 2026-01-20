/** @format */

import { ThemeProvider } from "@/components/themes/theme-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
    createRootRouteWithContext,
    Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { MyRouterContext } from "@/main";
import ReloadPrompt from "@/components/pwa/ReloadPrompt";

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
            <ReloadPrompt />
        </GoogleOAuthProvider>
    );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
    component: RootLayout,
});
