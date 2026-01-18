/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Award, Pencil, Trash2 } from "lucide-react";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import { CardActionMenu } from "../../-components/card-action-menu";
import { EditBehaviorDialog } from "./edit-behavior-dialog";
import { DeleteBehaviorDialog } from "./delete-behavior-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface BehaviorCardMobileProps {
    behavior: InstaQLEntity<AppSchema, "behaviors", { class?: {} }>;
    classId: string;
    canManage: boolean;
}

export function BehaviorCardMobile({
    behavior,
    classId,
    canManage,
}: BehaviorCardMobileProps) {
    const points = behavior.points ?? 0;
    const isPositive = points >= 0;
    const pointsDisplay = isPositive ? `+${points}` : String(points);

    const iconBlock = (
        <div className="flex size-10 md:size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {behavior.icon ? (
                <FontAwesomeIconFromId
                    id={behavior.icon}
                    className="size-5 md:size-7 text-primary"
                    fallback={<Award className="size-5 md:size-7 text-primary" />}
                />
            ) : (
                <Award className="size-5 md:size-7 text-primary" />
            )}
        </div>
    );

    return (
        <Card className="relative h-[100px] md:h-[150px]">
            <CardContent className="p-0 flex flex-col items-center text-center">
                {canManage && (
                    <div className="absolute top-1 right-1 md:top-2 md:right-2 z-10">
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
                    </div>
                )}
                {iconBlock}
                <span className="mt-0.5 md:mt-2 line-clamp-2 text-[10px] md:text-sm">{behavior.name}</span>
                <span
                    className={`mt-0 md:mt-1 text-[10px] md:text-xs ${
                        isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                    }`}
                >
                    {pointsDisplay}
                </span>
            </CardContent>
        </Card>
    );
}
