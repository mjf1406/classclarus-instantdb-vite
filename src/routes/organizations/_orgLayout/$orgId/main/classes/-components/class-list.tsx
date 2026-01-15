/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassRow } from "./class-row";
import type { ClassWithRelations } from "@/hooks/use-class-hooks";

interface ClassListProps {
    classes: ClassWithRelations[];
    isLoading?: boolean;
}

function ClassRowSkeleton() {
    return (
        <Card>
            <CardContent className="py-3">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-8 rounded" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function ClassList({
    classes,
    isLoading,
}: ClassListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ClassRowSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (classes.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {classes.map((classEntity) => (
                <ClassRow
                    key={classEntity.id}
                    classEntity={classEntity}
                />
            ))}
        </div>
    );
}
