/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { CardActionMenu } from "../../-components/card-action-menu";
import { EditStudentDialog } from "./edit-student-dialog";
import { KickUserDialog } from "@/components/members/kick-user-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface StudentPointsCardProps {
    student: InstaQLEntity<AppSchema, "$users">;
    classId: string;
    totalPoints: number;
    existingRoster: { id: string; number?: number } | null;
    canManage: boolean;
}

export function StudentPointsCard({
    student,
    classId,
    totalPoints,
    existingRoster,
    canManage,
}: StudentPointsCardProps) {
    const rosterNumber = existingRoster?.number;
    const firstName = student.firstName?.trim() || "—";
    const gender = student.gender?.trim() || "—";

    return (
        <Card className="relative min-h-[80px] lg:min-h-[120px] py-1">
            <CardContent className="flex flex-col p-1 lg:p-2">
                {/* Upper row: number (left), points + action menu (right) */}
                <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] shrink-0 text-muted-foreground lg:text-xs">
                        {rosterNumber !== undefined && rosterNumber !== null
                            ? rosterNumber
                            : "—"}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                        <span className="rounded bg-primary px-1 py-0.5 text-[10px] font-medium leading-tight text-primary-foreground lg:px-2 lg:text-sm">
                            {totalPoints}
                        </span>
                        {canManage && (
                            <CardActionMenu triggerClassName="h-6 w-6 lg:h-8 lg:w-8">
                                <EditStudentDialog
                                    student={student}
                                    classId={classId}
                                    existingRoster={existingRoster}
                                    asDropdownItem
                                >
                                    <Pencil className="size-4" /> Edit student
                                </EditStudentDialog>
                                <KickUserDialog
                                    user={student}
                                    contextType="class"
                                    contextId={classId}
                                    canKick={canManage}
                                    asDropdownItem
                                />
                            </CardActionMenu>
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
