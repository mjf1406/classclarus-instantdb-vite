/** @format */

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./style.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import type { AuthContextValue } from "./components/auth/auth-provider";
import { useAuthContext } from "./components/auth/auth-provider";
import AuthProvider from "./components/auth/auth-provider";
import PendingComponent from "./components/loading/pending-components";

// Define router context type
export interface MyRouterContext {
    auth: AuthContextValue | undefined;
}

// Create a new router instance with context
const router = createRouter({
    routeTree,
    context: {
        // auth will initially be undefined
        // We'll be passing down the auth state from within a React component
        auth: undefined!,
    },
    defaultPreload: "viewport",
    // defaultPreloadMaxAge: 60, // TypeScript says this does not exist on this object
    defaultPreloadGcTime: 1000 * 60, // 1 minute,
    defaultPendingComponent: PendingComponent,
    defaultPendingMs: 50,
    defaultPendingMinMs: 300,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

// Inner component that provides auth context to router
function InnerApp() {
    const auth = useAuthContext();
    return <RouterProvider router={router} context={{ auth }} />;
}

// Render the app
const rootElement = document.getElementById("root")!;
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <AuthProvider>
                <InnerApp />
            </AuthProvider>
        </StrictMode>
    );
}
