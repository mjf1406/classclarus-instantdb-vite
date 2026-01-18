/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { UnderConstruction } from "@/components/under-construction";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { useAuthContext } from "@/components/auth/auth-provider";
import { StudentParentDashboard } from "./-components/student-parent-dashboard";
import { DashboardPreferences } from "./-components/dashboard-preferences";

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
    const { user } = useAuthContext();

    const isStudent = roleInfo.isStudent;
    const isGuardian = roleInfo.isGuardian;
    const showStudentDashboard = isStudent || isGuardian;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Dashboard
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Loading...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LayoutDashboard className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Dashboard
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            {showStudentDashboard
                                ? "Your personalized dashboard"
                                : "View class overview and statistics"}
                        </p>
                    </div>
                </div>
                {isStudent && user?.id && classId && (
                    <DashboardPreferences classId={classId} studentId={user.id} />
                )}
            </div>
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
