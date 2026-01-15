/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { AssistantTeacherIcon } from "@/components/icons/role-icons";
import { UnderConstruction } from "@/components/under-construction";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/assistant-teachers/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AssistantTeacherIcon className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Assistant Teachers
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Manage assistant teachers in your organization
                        </p>
                    </div>
                </div>
            </div>
            <div className="h-[calc(100vh-12rem)]">
                <UnderConstruction />
            </div>
        </div>
    );
}
