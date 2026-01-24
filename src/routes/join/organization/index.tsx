/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { JoinOrganizationForm } from "../-components/join-organization-form";

export const Route = createFileRoute("/join/organization/")({
    component: RouteComponent,
});

function RouteComponent() {
    return <JoinOrganizationForm />;
}
