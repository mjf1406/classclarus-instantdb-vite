/** @format */

import { useMemo } from "react";
import { BookOpen, TrendingUp, Minus, TrendingDown, AlertCircle } from "lucide-react";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import {
    getAssessmentStatus,
    checkRtiStatus,
    getStatusLabel as getUrgencyStatusLabel,
    type UrgencyStatus,
} from "../../../class-management/reading/-components/raz-utils";

interface RazAssessmentsWidgetProps {
    classId: string;
    studentId: string;
}

type ClassRosterWithAssessments = InstaQLEntity<
    AppSchema,
    "class_roster",
    {
        razAssessments: {};
        student: {};
        class: {};
    }
>;

type ClassRosterQueryResult = {
    class_roster: ClassRosterWithAssessments[];
};

export function RazAssessmentsWidget({
    classId,
    studentId,
}: RazAssessmentsWidgetProps) {
    // Query class_roster entry for this student with assessments
    const { data: rosterData } = db.useQuery(
        studentId && classId
            ? {
                  class_roster: {
                      $: {
                          where: {
                              and: [
                                  { "student.id": studentId },
                                  { "class.id": classId },
                              ],
                          },
                      },
                      razAssessments: {
                          $: { order: { date: "desc" as const } },
                      },
                      student: {},
                      class: {},
                  },
              }
            : null
    );

    const typedRosterData = (rosterData as ClassRosterQueryResult | undefined) ?? null;
    const rosterEntry = typedRosterData?.class_roster?.[0];
    const assessments = rosterEntry?.razAssessments ?? [];

    // Get the most recent assessment for current level and status
    const latestAssessment = assessments[0];
    const currentLevel = latestAssessment?.level ?? null;
    const lastTestDate = latestAssessment?.date
        ? new Date(latestAssessment.date)
        : null;
    const lastResult = latestAssessment?.result ?? null;

    // Calculate assessment status
    const assessmentStatus = getAssessmentStatus(
        lastTestDate,
        lastResult,
        currentLevel
    );

    // Check RTI status
    const allAssessments = assessments.map((a) => ({
        result: a.result ?? "",
        date: new Date(a.date),
    }));
    const rtiStatus = checkRtiStatus(allAssessments);

    // Determine the primary status to display (RTI takes precedence if needed)
    const displayStatus: UrgencyStatus | "rti" = rtiStatus.needsRti
        ? "rti"
        : assessmentStatus.status;

    // Calculate statistics
    const stats = useMemo(() => {
        const total = assessments.length;
        const levelUps = assessments.filter((a) => a.result === "level up").length;
        const stays = assessments.filter((a) => a.result === "stay").length;
        const levelDowns = assessments.filter((a) => a.result === "level down").length;

        return {
            total,
            levelUps,
            stays,
            levelDowns,
        };
    }, [assessments]);

    // Format date for display
    const formatDate = (date: Date | string | number): string => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Get status badge styling
    // const getStatusBadgeStyle = (status: UrgencyStatus | "rti") => {
    //     switch (status) {
    //         case "overdue":
    //             return "bg-red-100 border-red-300 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200";
    //         case "due-now":
    //             return "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200";
    //         case "coming-soon":
    //             return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200";
    //         case "up-to-date":
    //             return "bg-green-100 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200";
    //         case "rti":
    //             return "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200";
    //     }
    // };

    const getDisplayStatusLabel = (status: UrgencyStatus | "rti"): string => {
        if (status === "rti") return "RTI Review";
        return getUrgencyStatusLabel(status);
    };

    // Calculate next test date range
    const getNextTestDateRange = useMemo(() => {
        if (!lastTestDate || displayStatus === "rti" || displayStatus === "up-to-date") {
            return null;
        }

        const scheduleInfo = assessmentStatus.scheduleInfo;
        const lowerBoundDate = new Date(lastTestDate);
        lowerBoundDate.setDate(lowerBoundDate.getDate() + scheduleInfo.lowerBoundDays);

        const upperBoundDate = new Date(lastTestDate);
        upperBoundDate.setDate(upperBoundDate.getDate() + scheduleInfo.upperBoundDays);

        return {
            start: lowerBoundDate,
            end: upperBoundDate,
        };
    }, [lastTestDate, displayStatus, assessmentStatus.scheduleInfo]);

    return (
        <Card style={{ backgroundColor: "var(--student-card-bg)" }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    RAZ Reading Assessments
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Level Display */}
                <div className="flex items-center justify-center pt-2 border-t">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">Current Level</span>
                        <span className="text-4xl md:text-5xl font-bold">
                            {currentLevel ?? "—"}
                        </span>
                    </div>
                </div>

                {/* Assessment Status Banner */}
                <div
                    className="rounded-lg border p-3"
                    style={{
                        backgroundColor: "var(--student-bg-color)",
                        color: "var(--student-bg-text-color, inherit)",
                    }}
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {displayStatus === "rti" ? (
                                    <AlertCircle className="size-5" />
                                ) : displayStatus === "overdue" ? (
                                    <TrendingDown className="size-5" />
                                ) : displayStatus === "due-now" ? (
                                    <Minus className="size-5" />
                                ) : displayStatus === "coming-soon" ? (
                                    <Minus className="size-5" />
                                ) : (
                                    <TrendingUp className="size-5" />
                                )}
                                <span className="font-semibold">
                                    {getDisplayStatusLabel(displayStatus)}
                                </span>
                            </div>
                            {displayStatus === "rti" && (
                                <Badge variant="secondary" className="ml-2">
                                    {rtiStatus.consecutiveNonLevelUp} consecutive
                                </Badge>
                            )}
                        </div>
                        {getNextTestDateRange &&
                            (displayStatus === "coming-soon" ||
                                displayStatus === "overdue" ||
                                displayStatus === "due-now") && (
                                <div className="text-sm">
                                    Your next test should be between{" "}
                                    <span className="font-medium">
                                        {formatDate(getNextTestDateRange.start)}
                                    </span>{" "}
                                    and{" "}
                                    <span className="font-medium">
                                        {formatDate(getNextTestDateRange.end)}
                                    </span>
                                </div>
                            )}
                    </div>
                </div>

                {/* Statistics */}
                <div className="flex items-center justify-center gap-3 md:gap-6 pt-2 border-t">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold">
                            {stats.total}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Total
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-green-600 dark:text-green-500">
                            {stats.levelUps}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Level Ups
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-amber-600 dark:text-amber-500">
                            {stats.stays}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">Stays</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-red-600 dark:text-red-500">
                            {stats.levelDowns}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Level Downs
                        </span>
                    </div>
                </div>

                {/* Assessment History */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Assessment History
                    </h3>
                    <ScrollArea className="h-[300px] md:h-[400px]">
                        <div className="pr-4 space-y-2">
                            {assessments.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <BookOpen className="size-12 mx-auto mb-2 opacity-50" />
                                    <p>No assessments recorded</p>
                                </div>
                            ) : (
                                assessments.map((assessment) => {
                                    const result = assessment.result;
                                    const resultBadgeVariant =
                                        result === "level up"
                                            ? "default"
                                            : result === "stay"
                                              ? "secondary"
                                              : "destructive";
                                    const resultColor =
                                        result === "level up"
                                            ? "text-green-700 dark:text-green-400"
                                            : result === "stay"
                                              ? "text-amber-700 dark:text-amber-400"
                                              : "text-red-700 dark:text-red-400";

                                    return (
                                        <Card
                                            key={assessment.id}
                                            className="p-3"
                                            style={{ backgroundColor: "var(--student-card-bg)" }}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-lg">
                                                                Level {assessment.level}
                                                            </span>
                                                            <Badge
                                                                variant={resultBadgeVariant}
                                                                className={resultColor}
                                                            >
                                                                {result === "level up"
                                                                    ? "Level Up"
                                                                    : result === "stay"
                                                      ? "Stay"
                                                      : "Level Down"}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(assessment.date)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(assessment.accuracy !== null &&
                                                    assessment.accuracy !== undefined) ||
                                                (assessment.quizScore !== null &&
                                                    assessment.quizScore !== undefined) ? (
                                                    <div className="flex gap-3 text-sm">
                                                        {assessment.accuracy !== null &&
                                                        assessment.accuracy !== undefined ? (
                                                            <span className="text-muted-foreground">
                                                                Accuracy:{" "}
                                                                <span className="font-medium">
                                                                    {Math.round(assessment.accuracy)}%
                                                                </span>
                                                            </span>
                                                        ) : null}
                                                        {assessment.quizScore !== null &&
                                                        assessment.quizScore !== undefined ? (
                                                            <span className="text-muted-foreground">
                                                                Quiz:{" "}
                                                                <span className="font-medium">
                                                                    {Math.round(assessment.quizScore)}%
                                                                </span>
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                                {assessment.note ? (
                                                    <p className="text-sm text-muted-foreground italic">
                                                        {assessment.note}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
