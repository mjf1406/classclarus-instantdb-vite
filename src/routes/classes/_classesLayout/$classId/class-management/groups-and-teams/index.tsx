/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Users, Plus } from "lucide-react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGroupDialog } from "./-components/create-group-dialog";
import { GroupCard } from "./-components/group-card";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/class-management/groups-and-teams/"
)({
    component: RouteComponent,
});

type Group = InstaQLEntity<
    AppSchema,
    "groups",
    {
        class: {};
        groupStudents: {};
        groupTeams: {
            teamStudents: {};
        };
    }
>;

type GroupsQueryResult = {
    groups: Group[];
};

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    if (!classId) {
        return null;
    }

    // Query groups with students and teams
    const { data: groupsData, isLoading: groupsLoading } = db.useQuery(
        classId
            ? {
                  groups: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                      groupStudents: {},
                      groupTeams: {
                          teamStudents: {},
                      },
                  },
              }
            : null
    );

    const typedGroupsData =
        (groupsData as GroupsQueryResult | undefined) ?? null;
    const groups = typedGroupsData?.groups || [];

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
                        <Users className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Groups & Teams
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Manage student groups and teams for your class
                            </p>
                        </div>
                    </div>
                    {canManage && (
                        <CreateGroupDialog classId={classId}>
                            <Button>
                                <Plus className="size-4 mr-2" />
                                Create Group
                            </Button>
                        </CreateGroupDialog>
                    )}
                </div>

                {groupsLoading ? (
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
                ) : groups.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No groups have been created yet.
                            </p>
                            {canManage && (
                                <CreateGroupDialog classId={classId}>
                                    <Button>
                                        <Plus className="size-4 mr-2" />
                                        Create Your First Group
                                    </Button>
                                </CreateGroupDialog>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {groups.map((group) => (
                            <GroupCard
                                key={group.id}
                                group={group}
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
