/** @format */

import { useEffect } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { UnderConstruction } from "@/components/under-construction";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { useSidebar } from "@/components/ui/sidebar";
import { StudentParentDashboard } from "./-components/student-parent-dashboard";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/main/dashboard/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);
    const { setOpen } = useSidebar();

    const isGuardian = roleInfo.isGuardian;
    const showStudentDashboard = roleInfo.isStudent || isGuardian;

    // Auto-collapse sidebar on dashboard page
    useEffect(() => {
        setOpen(false);
    }, [setOpen]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {showStudentDashboard && classId ? (
                <StudentParentDashboard
                    classId={classId}
                    isGuardian={isGuardian}
                />
            ) : (
                <div className="h-[calc(100vh-12rem)]">
                    <UnderConstruction />
                </div>
            )}
        </div>
    );
}
