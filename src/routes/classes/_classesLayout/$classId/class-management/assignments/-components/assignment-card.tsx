/** @format */

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { AssignmentActionMenu } from "./assignment-action-menu";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type AssignmentEntity = InstaQLEntity<AppSchema, "assignments">;

interface AssignmentCardProps {
    assignment: AssignmentEntity;
    classId: string;
    canManage: boolean;
}

export function AssignmentCard({
    assignment,
    classId,
    canManage,
}: AssignmentCardProps) {
    // Parse sections if they exist
    let sections: Array<{ name: string; points: number }> | null = null;
    if (assignment.sections) {
        try {
            sections = JSON.parse(assignment.sections) as Array<{
                name: string;
                points: number;
            }>;
        } catch {
            sections = null;
        }
    }

    const totalPoints = sections
        ? sections.reduce((sum, s) => sum + (s.points || 0), 0)
        : assignment.totalPoints;

    return (
        <Card className="relative flex flex-col h-full">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg line-clamp-2">
                            {assignment.name}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {assignment.subject && (
                                <Badge variant="secondary">
                                    {assignment.subject}
                                </Badge>
                            )}
                            {assignment.unit && (
                                <Badge variant="outline">
                                    {assignment.unit}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {canManage && (
                        <AssignmentActionMenu
                            assignment={assignment}
                            classId={classId}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-3">
                    {sections && sections.length > 0 ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Sections:</div>
                            <div className="space-y-1">
                                {sections.map((section, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-muted-foreground">
                                            {section.name}
                                        </span>
                                        <span className="font-medium">
                                            {section.points} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {totalPoints !== undefined && (
                        <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm font-medium">
                                Total Points:
                            </span>
                            <span className="text-sm font-semibold">
                                {totalPoints}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Calendar className="size-3" />
                    <span>
                        Created{" "}
                        {format(new Date(assignment.created), "MMM d, yyyy")}
                    </span>
                </div>
                {assignment.updated &&
                    assignment.updated !== assignment.created && (
                        <span>
                            Updated{" "}
                            {format(new Date(assignment.updated), "MMM d, yyyy")}
                        </span>
                    )}
            </CardFooter>
        </Card>
    );
}
