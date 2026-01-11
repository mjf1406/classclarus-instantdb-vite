/** @format */

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/organizations/_orgLayout")({
    component: RouteComponent,
});

function RouteComponent() {
    // This is where the sidebar layout when viewing a single organization goes
    return (
        <div className="flex flex-col min-w-screen min-h-screen items-center justify-center gap-1">
            <h1 className="text-2xl font-bold">Organizations</h1>
            <Outlet />
        </div>
    );
}
