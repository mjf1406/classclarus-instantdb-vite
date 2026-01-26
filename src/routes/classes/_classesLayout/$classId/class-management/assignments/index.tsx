/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db/db";
import { AssignmentsGrid } from "./-components/assignments-grid";
import { CreateAssignmentDialog } from "./-components/create-assignment-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/class-management/assignments/"
)({
    component: RouteComponent,
});

type AssignmentEntity = InstaQLEntity<
    AppSchema,
    "assignments",
    { class?: {} }
>;

type AssignmentsQueryResult = {
    assignments?: AssignmentEntity[];
};

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const assignmentsQuery = classId
        ? {
              assignments: {
                  $: { where: { "class.id": classId } },
                  class: {},
              },
          }
        : null;

    const { data, isLoading: assignmentsLoading } =
        db.useQuery(assignmentsQuery);

    const typedAssignments =
        (data as AssignmentsQueryResult | undefined) ?? null;
    const assignments = typedAssignments?.assignments || [];

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Assignments
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage assignments for your class
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <CreateAssignmentDialog classId={classId ?? ""}>
                                <Button size="lg">
                                    <Plus className="size-4 mr-2" />
                                    <span className="hidden md:inline">
                                        Create Assignment
                                    </span>
                                    <span className="md:hidden">Create</span>
                                </Button>
                            </CreateAssignmentDialog>
                        )}
                    </div>
                </div>
                <div className="w-full">
                    <AssignmentsGrid
                        assignments={assignments}
                        classId={classId ?? ""}
                        isLoading={assignmentsLoading}
                        canManage={canManage}
                    />
                </div>
            </div>
        </RestrictedRoute>
    );
}
