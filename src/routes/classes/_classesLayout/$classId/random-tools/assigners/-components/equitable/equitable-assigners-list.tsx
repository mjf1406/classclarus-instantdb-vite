/** @format */

import { Plus, MoreVertical, Package } from "lucide-react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAssignerDialog } from "./create-assigner-dialog";
import { EditAssignerDialog } from "./edit-assigner-dialog";
import { DeleteAssignerDialog } from "./delete-assigner-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface EquitableAssignersListProps {
    classId: string;
    canManage: boolean;
}

type EquitableAssigner = InstaQLEntity<AppSchema, "equitable_assigners", { class: {} }>;

type EquitableAssignersQueryResult = { equitable_assigners: EquitableAssigner[] };

export function EquitableAssignersList({
    classId,
    canManage,
}: EquitableAssignersListProps) {
    const { data, isLoading } = db.useQuery(
        classId
            ? {
                  equitable_assigners: {
                      $: { where: { "class.id": classId } },
                      class: {},
                  },
              }
            : null
    );

    const typedAssigners =
        (data as EquitableAssignersQueryResult | undefined) ?? null;
    const assigners = typedAssigners?.equitable_assigners ?? [];

    // Parse items count for each assigner
    const getItemCount = (assigner: EquitableAssigner): number => {
        try {
            if (!assigner.items || !assigner.items.trim()) return 0;
            const parsed = JSON.parse(assigner.items);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {assigners.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="size-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No Equitable Assigners
                        </h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            {canManage
                                ? "Create your first equitable assigner to start assigning items to students."
                                : "No equitable assigners have been created yet."}
                        </p>
                        {canManage && (
                            <CreateAssignerDialog classId={classId}>
                                <Button>
                                    <Plus className="size-4" />
                                    Create Assigner
                                </Button>
                            </CreateAssignerDialog>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assigners.map((assigner) => {
                        const itemCount = getItemCount(assigner);
                        return (
                            <Card key={assigner.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                {assigner.name}
                                            </CardTitle>
                                        </div>
                                        {canManage && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                    >
                                                        <MoreVertical className="size-4" />
                                                        <span className="sr-only">
                                                            More options
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <EditAssignerDialog
                                                        assigner={assigner}
                                                        asDropdownItem
                                                    >
                                                        Edit
                                                    </EditAssignerDialog>
                                                    <DeleteAssignerDialog
                                                        assigner={assigner}
                                                        asDropdownItem
                                                    >
                                                        Delete
                                                    </DeleteAssignerDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Package className="size-4" />
                                        <span>
                                            {itemCount === 1
                                                ? "1 item"
                                                : `${itemCount} items`}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
