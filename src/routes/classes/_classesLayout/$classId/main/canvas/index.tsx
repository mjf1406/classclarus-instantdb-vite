/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { CanvasContainer } from "./-components/canvas-container";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/main/canvas/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!classEntity) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
                <div className="text-muted-foreground">Class not found</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Place</h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Collaborative pixel art canvas
                        </p>
                    </div>
                </div>
            </div>
            <CanvasContainer classId={classId || ""} roleInfo={roleInfo} />
        </div>
    );
}
