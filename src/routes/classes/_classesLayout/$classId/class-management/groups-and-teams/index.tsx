/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Users, Plus, Download } from "lucide-react";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { useAuthContext } from "@/components/auth/auth-provider";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGroupDialog } from "./-components/create-group-dialog";
import { GroupCard } from "./-components/group-card";
import { ExportPDFDialog } from "./-components/export-pdf-dialog";
import { useMemo } from "react";
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

type UserQueryResult = {
    $users: Array<InstaQLEntity<AppSchema, "$users", { children: {} }>>;
};

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);
    const { user } = useAuthContext();
    const userId = user?.id;

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

    // Query user's children if they're a guardian
    const { data: userData } = db.useQuery(
        userId && roleInfo.isGuardian
            ? {
                  $users: {
                      $: { where: { id: userId } },
                      children: {},
                  },
              }
            : null
    );

    const typedUserData = (userData as UserQueryResult | undefined) ?? null;
    const guardianUser = typedUserData?.$users?.[0];
    const allChildren = guardianUser?.children || [];

    // Query class students to filter children who are in this class
    const { data: classData } = db.useQuery(
        classId && roleInfo.isGuardian
            ? {
                  classes: {
                      $: { where: { id: classId } },
                      classStudents: {},
                  },
              }
            : null
    );

    const classStudents =
        (classData as { classes?: Array<{ classStudents?: Array<{ id: string }> }> } | undefined)
            ?.classes?.[0]?.classStudents || [];

    const classStudentIds = new Set(classStudents.map((s) => s.id));

    // Filter children who are students in this class
    const childrenInClass = useMemo(() => {
        return allChildren.filter((child) => classStudentIds.has(child.id));
    }, [allChildren, classStudentIds]);

    // Determine which student IDs to highlight
    // For students: highlight themselves
    // For guardians: highlight their children in this class
    const highlightedStudentIds = useMemo(() => {
        if (roleInfo.isStudent && userId) {
            return [userId];
        }
        if (roleInfo.isGuardian) {
            return childrenInClass.map((child) => child.id);
        }
        return [];
    }, [roleInfo.isStudent, roleInfo.isGuardian, userId, childrenInClass]);

    const typedGroupsData =
        (groupsData as GroupsQueryResult | undefined) ?? null;
    const groups = typedGroupsData?.groups || [];

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    // Determine description based on role
    const description = canManage
        ? "Manage student groups and teams for your class"
        : "View groups and teams in your class";

    if (isLoading) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Groups & Teams
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            {description}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {groups.length > 0 && (
                        <ExportPDFDialog
                            groups={groups}
                            className={classEntity?.name || "Class"}
                        >
                            <Button variant="outline">
                                <Download className="size-4 mr-2" />
                                Export
                            </Button>
                        </ExportPDFDialog>
                    )}
                    {canManage && (
                        <CreateGroupDialog classId={classId}>
                            <Button>
                                <Plus className="size-4 mr-2" />
                                Create Group
                            </Button>
                        </CreateGroupDialog>
                    )}
                </div>
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
                            highlightedStudentIds={highlightedStudentIds}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
