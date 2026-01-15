/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-utils";
import { JoinForm } from "./-components/join-form";

export const Route = createFileRoute("/join/")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <JoinForm />;
}
