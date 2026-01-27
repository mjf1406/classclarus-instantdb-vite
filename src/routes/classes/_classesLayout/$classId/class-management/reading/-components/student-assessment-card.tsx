/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronRight, Info, AlertTriangle, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { StudentAssessmentStatus, UrgencyStatus } from "./raz-utils";
import { getStatusColor, getStatusLabel, getStatusBadgeVariant } from "./raz-utils";

interface StudentAssessmentCardProps {
    studentId: string;
    studentNumber?: number;
    firstName?: string;
    lastName?: string;
    level: string | null;
    lastTestDate: Date | null;
    lastResult: string | null;
    assessmentStatus: StudentAssessmentStatus;
    needsRti?: boolean;
    rtiConsecutiveCount?: number;
    onAssess: () => void;
}

function getStatusIcon(status: UrgencyStatus) {
    switch (status) {
        case "overdue":
            return <AlertTriangle className="size-4" />;
        case "due-now":
            return <Clock className="size-4" />;
        case "coming-soon":
            return <Clock className="size-4" />;
        case "up-to-date":
            return <CheckCircle className="size-4" />;
    }
}

export function StudentAssessmentCard({
    studentNumber,
    firstName,
    lastName,
    level,
    lastResult,
    assessmentStatus,
    needsRti = false,
    rtiConsecutiveCount = 0,
    onAssess,
}: StudentAssessmentCardProps) {
    const { status, daysSinceTest, scheduleInfo, detailedExplanation } =
        assessmentStatus;

    const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown Student";
    const displayNumber = studentNumber ? `#${studentNumber}` : "";

    // Format days display
    const daysDisplay =
        daysSinceTest !== null
            ? `${daysSinceTest} day${daysSinceTest === 1 ? "" : "s"} ago`
            : "Never tested";

    // Format last result with styling
    const resultBadge = lastResult && (
        <Badge
            variant={
                lastResult === "level down"
                    ? "destructive"
                    : lastResult === "level up"
                      ? "default"
                      : "secondary"
            }
            className="text-xs"
        >
            {lastResult}
        </Badge>
    );

    return (
        <Card
            className={`${getStatusColor(status)} border transition-all hover:shadow-md cursor-pointer group`}
            onClick={onAssess}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Student name and number */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                                {displayName}
                            </span>
                            {displayNumber && (
                                <span className="text-muted-foreground text-sm">
                                    {displayNumber}
                                </span>
                            )}
                        </div>

                        {/* Level and days info */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span>
                                {level ? `Level ${level}` : "No level"}
                            </span>
                            <span>•</span>
                            <span>{daysDisplay}</span>
                        </div>

                        {/* Status badge and last result */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getStatusBadgeVariant(status)}>
                                {getStatusIcon(status)}
                                <span className="ml-1">{getStatusLabel(status)}</span>
                            </Badge>
                            {resultBadge}
                            {needsRti && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="destructive" className="text-xs">
                                            <AlertCircle className="size-3 mr-1" />
                                            RTI Review Needed
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <div className="text-xs">
                                            <div className="font-medium mb-1">
                                                Not progressing at expected rate
                                            </div>
                                            <div>
                                                This student has not leveled up in their last {rtiConsecutiveCount} assessment{rtiConsecutiveCount === 1 ? "" : "s"}.
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    {/* Info tooltip and action button */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Info className="size-4 text-muted-foreground" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="left"
                                className="max-w-xs whitespace-pre-line text-left"
                            >
                                <div className="space-y-2">
                                    <div className="font-medium">
                                        Assessment Status Details
                                    </div>
                                    <div className="text-xs">
                                        {detailedExplanation}
                                    </div>
                                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                        {scheduleInfo.scheduleText}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
