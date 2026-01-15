/** @format */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/admins"
)({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/organizations/members/admins"!</div>;
}
