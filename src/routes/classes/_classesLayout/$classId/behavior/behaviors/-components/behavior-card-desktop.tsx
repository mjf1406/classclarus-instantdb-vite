/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Folder, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import { CardActionMenu } from "../../-components/card-action-menu";
import { EditBehaviorDialog } from "./edit-behavior-dialog";
import { DeleteBehaviorDialog } from "./delete-behavior-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface BehaviorCardDesktopProps {
    behavior: InstaQLEntity<AppSchema, "behaviors", { class?: {}; folder?: {} }>;
    classId: string;
    canManage: boolean;
}

export function BehaviorCardDesktop({
    behavior,
    classId,
    canManage,
}: BehaviorCardDesktopProps) {
    const points = behavior.points ?? 0;
    const isPositive = points >= 0;
    const pointsDisplay = isPositive ? `+${points}` : String(points);

    const iconBlock = (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {behavior.icon ? (
                <FontAwesomeIconFromId
                    id={behavior.icon}
                    className="size-7 text-primary"
                    fallback={<Award className="size-7 text-primary" />}
                />
            ) : (
                <Award className="size-7 text-primary" />
            )}
        </div>
    );

    return (
        <Card className="relative">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-sm lg:text-lg flex items-center gap-3">
                            {iconBlock}
                            {behavior.name}
                        </CardTitle>
                        {behavior.description && (
                            <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                                {behavior.description}
                            </p>
                        )}
                    </div>
                    {canManage && (
                        <CardActionMenu>
                            <EditBehaviorDialog
                                behavior={behavior}
                                classId={classId}
                                asDropdownItem
                            >
                                <Pencil className="size-4" /> Edit
                            </EditBehaviorDialog>
                            <DeleteBehaviorDialog
                                behavior={behavior}
                                asDropdownItem
                            >
                                <Trash2 className="size-4" /> Delete
                            </DeleteBehaviorDialog>
                        </CardActionMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
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
                        <span>{pointsDisplay}</span>
                    </div>
                    {behavior.folder && (
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            <Folder className="size-4" />
                            <span>{behavior.folder.name ?? "Unnamed"}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
