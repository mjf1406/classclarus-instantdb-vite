/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { JoinClassForm } from "../-components/join-class-form";

export const Route = createFileRoute("/join/class/")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            code: (search.code as string) || undefined,
        };
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <JoinClassForm />;
}
