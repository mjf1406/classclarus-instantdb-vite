/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Award, Plus } from "lucide-react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBehaviorDialog } from "./-components/create-behavior-dialog";
import { BehaviorCard } from "./-components/behavior-card";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/behavior/behaviors/"
)({
    component: RouteComponent,
});

type Behavior = InstaQLEntity<AppSchema, "behaviors", { class: {} }>;

type BehaviorsQueryResult = {
    behaviors: Behavior[];
};

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const { data: behaviorsData, isLoading: behaviorsLoading } = db.useQuery(
        classId
            ? {
                  behaviors: {
                      $: { where: { "class.id": classId } },
                      class: {},
                  },
              }
            : null
    );

    const typedData = (behaviorsData as BehaviorsQueryResult | undefined) ?? null;
    const behaviors = typedData?.behaviors ?? [];

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    if (!classId) {
        return null;
    }

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Award className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Behaviors
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage behaviors for your class
                            </p>
                        </div>
                    </div>
                    {canManage && (
                        <CreateBehaviorDialog classId={classId}>
                            <Button>
                                <Plus className="size-4 mr-2" />
                                Create Behavior
                            </Button>
                        </CreateBehaviorDialog>
                    )}
                </div>

                {behaviorsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardContent className="py-6">
                                    <Skeleton className="h-6 w-48 mb-4" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : behaviors.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Award className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No behaviors have been created yet.
                            </p>
                            {canManage && (
                                <CreateBehaviorDialog classId={classId}>
                                    <Button>
                                        <Plus className="size-4 mr-2" />
                                        Create Your First Behavior
                                    </Button>
                                </CreateBehaviorDialog>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {behaviors.map((behavior) => (
                            <BehaviorCard
                                key={behavior.id}
                                behavior={behavior}
                                classId={classId}
                                canManage={canManage}
                            />
                        ))}
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
