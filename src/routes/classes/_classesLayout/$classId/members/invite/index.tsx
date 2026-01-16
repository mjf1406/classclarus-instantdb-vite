/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { Card, CardContent } from "@/components/ui/card";
import { InviteCodesTabs } from "./-components/invite-codes-tabs";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/invite/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading: classLoading } =
        useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    // Get codes directly from class entity (already loaded via useClassById)
    const classEntityWithCodes = classEntity;

    const isLoading = classLoading;
    const hasPermission =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    const handleCopySuccess = (_type: "student" | "teacher" | "guardian") => {
        // Copy success feedback is handled within the sharing buttons
        // This callback can be used for additional actions if needed
    };

    if (!hasPermission) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlus className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Invite Members
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Invite new members to your class
                            </p>
                        </div>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-6">
                        <p className="text-sm text-muted-foreground text-center">
                            You don't have permission to invite members. Only
                            class owners, admins, and teachers can manage join
                            codes.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const codes = classEntityWithCodes
        ? {
              student: classEntityWithCodes.studentCode || null,
              teacher: classEntityWithCodes.teacherCode || null,
              guardian: classEntityWithCodes.guardianCode || null,
          }
        : { student: null, teacher: null, guardian: null };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserPlus className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Invite Members
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Share join codes to invite members to your class
                        </p>
                    </div>
                </div>
            </div>

            <InviteCodesTabs
                codes={codes}
                isLoading={isLoading}
                onCopySuccess={handleCopySuccess}
            />
        </div>
    );
}
