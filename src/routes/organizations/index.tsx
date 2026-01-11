/** @format */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/organizations/")({
    component: RouteComponent,
});

function RouteComponent() {
    // This is where the Organization Grid goes
    return <div>Hello "/organizations/"!</div>;
}
