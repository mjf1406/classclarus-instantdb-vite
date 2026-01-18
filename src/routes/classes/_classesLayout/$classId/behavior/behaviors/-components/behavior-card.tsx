/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Award, MoreVertical, TrendingUp, TrendingDown } from "lucide-react";
import { EditBehaviorDialog } from "./edit-behavior-dialog";
import { DeleteBehaviorDialog } from "./delete-behavior-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface BehaviorCardProps {
    behavior: InstaQLEntity<AppSchema, "behaviors", { class?: {} }>;
    classId: string;
    canManage: boolean;
}

export function BehaviorCard({ behavior, classId, canManage }: BehaviorCardProps) {
    const points = behavior.points ?? 0;
    const isPositive = points >= 0;

    const pointsDisplay = (
        isPositive ? `+${points}` : String(points)
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                            <Award className="size-5 text-primary" />
                            {behavior.name}
                        </CardTitle>
                        {behavior.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {behavior.description}
                            </p>
                        )}
                    </div>
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <MoreVertical className="size-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <EditBehaviorDialog
                                    behavior={behavior}
                                    classId={classId}
                                    asDropdownItem
                                >
                                    Edit
                                </EditBehaviorDialog>
                                <DeleteBehaviorDialog
                                    behavior={behavior}
                                    asDropdownItem
                                >
                                    Delete
                                </DeleteBehaviorDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium ${
                        isPositive
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-destructive/10 text-destructive"
                    }`}
                >
                    {isPositive ? (
                        <TrendingUp className="size-4" />
                    ) : (
                        <TrendingDown className="size-4" />
                    )}
                    <span>{pointsDisplay} pts</span>
                </div>
            </CardContent>
        </Card>
    );
}
