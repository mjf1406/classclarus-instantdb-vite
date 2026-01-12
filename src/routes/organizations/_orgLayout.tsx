/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
import LoginPage from "@/components/auth/login-page";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/organizations/_orgLayout")({
    component: RouteComponent,
});

function RouteComponent() {
    const { user, isLoading: authLoading } = useAuthContext();
    if (!user || !user.id) {
        return <LoginPage />;
    }
    if (authLoading) {
        return <Loader2 className="h-16 w-16 animate-spin text-foreground" />;
    }
    // This is where the sidebar layout when viewing a single organization goes
    return (
        <div className="flex flex-col min-w-screen min-h-screen items-center justify-center gap-1">
            <h1 className="text-2xl font-bold">Organizations</h1>
            <Outlet />
        </div>
    );
}
