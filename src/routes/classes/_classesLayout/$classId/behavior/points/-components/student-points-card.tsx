/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Undo2, Repeat } from "lucide-react";
import { CardActionMenu } from "../../-components/card-action-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { type ExistingRoster } from "./edit-student-dialog";
import { UndoLastActionDialog, type LastAction } from "./undo-last-action-dialog";
import { RepeatLastBehaviorDialog, type LastBehavior } from "./repeat-last-behavior-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface StudentPointsCardProps {
    student: InstaQLEntity<AppSchema, "$users">;
    classId: string;
    totalPoints: number;
    existingRoster: ExistingRoster;
    canManage: boolean;
    lastAction: LastAction | null;
    lastBehavior: LastBehavior | null;
}

export function StudentPointsCard({
    student,
    classId,
    totalPoints,
    existingRoster,
    canManage,
    lastAction,
    lastBehavior,
}: StudentPointsCardProps) {
    const rosterNumber = existingRoster?.number;
    const firstName =
        (existingRoster?.firstName ?? student.firstName)?.trim() || "—";
    const gender =
        (existingRoster?.gender ?? student.gender)?.trim() || "—";

    return (
        <Card
            className={`relative min-h-[80px] lg:min-h-[120px] py-1 ${
                canManage ? "cursor-pointer" : ""
            }`}
        >
            <CardContent className="flex flex-col p-1 lg:p-2">
                {/* Upper row: number (left), points + action menu (right) */}
                <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] shrink-0 text-muted-foreground lg:text-xs">
                        {rosterNumber !== undefined && rosterNumber !== null
                            ? `#${rosterNumber}`
                            : "—"}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                        <span className="rounded bg-primary px-1 py-0.5 text-[10px] font-medium leading-tight text-primary-foreground lg:px-2 lg:text-sm">
                            {totalPoints}
                        </span>
                        {canManage && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <CardActionMenu triggerClassName="h-6 w-6 lg:h-8 lg:w-8">
                                    {lastAction && (
                                        <UndoLastActionDialog
                                            lastAction={lastAction}
                                            asDropdownItem
                                        >
                                            <Undo2 className="size-4" /> Undo last
                                            action
                                        </UndoLastActionDialog>
                                    )}
                                    {lastBehavior && (
                                        <RepeatLastBehaviorDialog
                                            lastBehavior={lastBehavior}
                                            studentId={student.id}
                                            classId={classId}
                                            asDropdownItem
                                        >
                                            <Repeat className="size-4" /> Repeat
                                            last behavior
                                        </RepeatLastBehaviorDialog>
                                    )}
                                    {!lastAction && !lastBehavior && (
                                        <DropdownMenuItem disabled>
                                            No recent actions
                                        </DropdownMenuItem>
                                    )}
                                </CardActionMenu>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: first name and gender */}
                <div className="flex flex-1 flex-col items-center justify-center overflow-hidden py-1 lg:py-2">
                    <div className="truncate text-center text-xs font-medium w-full lg:text-base">
                        {firstName}
                    </div>
                    <div className="text-center text-[10px] text-muted-foreground lg:text-xs">
                        {gender}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
