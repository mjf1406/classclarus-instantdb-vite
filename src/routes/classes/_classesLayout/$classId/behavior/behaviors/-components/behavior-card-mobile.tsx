/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Award, MoreVertical } from "lucide-react";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
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
            <CardContent className="flex flex-col items-center pt-6 pb-4 text-center">
                {canManage && (
                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    </div>
                )}
                {iconBlock}
                <span className="mt-2 line-clamp-2 text-sm">{behavior.name}</span>
                <span
                    className={`mt-1 text-xs ${
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
