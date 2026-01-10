/** @format */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    return (
        <div className="p-2">
            {/* Org grid/list go here that the user belongs to from the auth provider */}
            <h3>Welcome Home!</h3>
        </div>
    );
}
