/** @format */

import AuthProvider from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
        <ThemeProvider
            storageKey="vite-ui-theme"
            defaultTheme="classclarus"
        >
            <AuthProvider>
                <Outlet />
            </AuthProvider>
        </ThemeProvider>
        <TanStackRouterDevtools />
    </GoogleOAuthProvider>
);

export const Route = createRootRoute({ component: RootLayout });
