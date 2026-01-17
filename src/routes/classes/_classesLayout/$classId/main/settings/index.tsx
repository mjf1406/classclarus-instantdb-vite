/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { UnderConstruction } from "@/components/under-construction";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { RestrictedRoute } from "@/components/auth/restricted-route";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/main/settings/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Class Settings
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Manage class settings and preferences
                            </p>
                        </div>
                    </div>
                </div>
                <div className="h-[calc(100vh-12rem)]">
                    <UnderConstruction />
                </div>
            </div>
        </RestrictedRoute>
    );
}
