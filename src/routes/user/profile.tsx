/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-utils";

export const Route = createFileRoute("/user/profile")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/user/profile"!</div>;
}
