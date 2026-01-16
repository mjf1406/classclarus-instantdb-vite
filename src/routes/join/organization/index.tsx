/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-utils";
import { JoinOrganizationForm } from "../-components/join-organization-form";

export const Route = createFileRoute("/join/organization/")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <JoinOrganizationForm />;
}
