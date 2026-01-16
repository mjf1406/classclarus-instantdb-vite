/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-utils";
import { JoinClassForm } from "../-components/join-class-form";

export const Route = createFileRoute("/join/class/")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <JoinClassForm />;
}
