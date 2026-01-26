/** @format */

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { AssignmentCard } from "./assignment-card";
import { CreateAssignmentDialog } from "./create-assignment-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type AssignmentEntity = InstaQLEntity<AppSchema, "assignments">;

interface AssignmentsGridProps {
    assignments: AssignmentEntity[];
    classId: string;
    isLoading?: boolean;
    canManage: boolean;
}

function AssignmentCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="pt-2 border-t">
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function AssignmentsGrid({
    assignments,
    classId,
    isLoading = false,
    canManage,
}: AssignmentsGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <AssignmentCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <FileText className="size-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            No assignments yet
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Create your first assignment to get started. Add
                            sections or total points to track grading.
                        </p>
                    </div>
                    {canManage && (
                        <CreateAssignmentDialog classId={classId}>
                            <Button>
                                <Plus className="size-4 mr-2" />
                                Create Assignment
                            </Button>
                        </CreateAssignmentDialog>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
                <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    classId={classId}
                    canManage={canManage}
                />
            ))}
        </div>
    );
}
