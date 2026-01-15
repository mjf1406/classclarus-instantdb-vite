/** @format */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/parents"
)({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/organizations/_orgLayout/$orgId/members/parents"!</div>;
}
