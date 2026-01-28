/** @format */

import { useMemo } from "react";
import { format } from "date-fns";
import { Shuffle } from "lucide-react";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ShuffleResult } from "@/lib/randomizer/shuffler";

interface ShufflerHistoryWidgetProps {
    classId: string;
    studentId: string;
    itemBackground?: string;
}

type ShufflerRun = InstaQLEntity<AppSchema, "shuffler_runs", {}>;

type ShufflerRunsQueryResult = {
    shuffler_runs: ShufflerRun[];
};

interface StudentShuffleEntry {
    runId: string;
    runDate: Date;
    position: number;
    totalStudents: number;
    scopeName: string;
    wasFirst: boolean;
    wasLast: boolean;
}

export function ShufflerHistoryWidget({
    classId,
    studentId,
    itemBackground,
}: ShufflerHistoryWidgetProps) {
    // Query all shuffler runs for the class
    const { data: runsData } = db.useQuery(
        classId
            ? {
                  shuffler_runs: {
                      $: {
                          where: { "class.id": classId },
                          order: { runDate: "desc" as const },
                      },
                  },
              }
            : null
    );

    const typedRunsData = (runsData as ShufflerRunsQueryResult | undefined) ?? null;
    const allRuns = typedRunsData?.shuffler_runs ?? [];

    // Filter runs where student participated and extract their position
    const studentShuffles = useMemo(() => {
        const entries: StudentShuffleEntry[] = [];

        for (const run of allRuns) {
            try {
                const results: ShuffleResult[] = JSON.parse(run.results);
                const studentResult = results.find((r) => r.studentId === studentId);

                if (studentResult) {
                    entries.push({
                        runId: run.id,
                        runDate: new Date(run.runDate),
                        position: studentResult.position,
                        totalStudents: results.length,
                        scopeName: run.scopeName,
                        wasFirst: run.firstStudentId === studentId,
                        wasLast: run.lastStudentId === studentId,
                    });
                }
            } catch (e) {
                console.error("Failed to parse shuffle results:", e);
            }
        }

        return entries;
    }, [allRuns, studentId]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalShuffles = studentShuffles.length;
        const timesFirst = studentShuffles.filter((s) => s.wasFirst).length;
        const timesLast = studentShuffles.filter((s) => s.wasLast).length;

        return {
            totalShuffles,
            timesFirst,
            timesLast,
        };
    }, [studentShuffles]);

    return (
        <Card style={{ backgroundColor: "var(--student-card-bg)" }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shuffle className="size-5 text-primary" />
                    Shuffle History
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistics */}
                <div className="flex items-center justify-center gap-3 md:gap-6 pt-2 border-t">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold">
                            {stats.totalShuffles}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Total Shuffles
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-green-600">
                            {stats.timesFirst}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Times First
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-orange-600">
                            {stats.timesLast}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Times Last
                        </span>
                    </div>
                </div>

                {/* History List */}
                <ScrollArea className="h-[300px] md:h-[400px]">
                    <div className="pr-4 space-y-2">
                        {studentShuffles.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Shuffle className="size-12 mx-auto mb-2 opacity-50" />
                                <p>No shuffle history yet</p>
                            </div>
                        ) : (
                            studentShuffles.map((entry) => (
                                <Card
                                    key={entry.runId}
                                    className="p-3"
                                    style={itemBackground ? { backgroundColor: itemBackground } : undefined}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">
                                                    {format(entry.runDate, "MMM d, yyyy 'at' h:mm a")}
                                                </span>
                                                {entry.wasFirst && (
                                                    <Badge variant="default" className="bg-green-600">
                                                        First
                                                    </Badge>
                                                )}
                                                {entry.wasLast && (
                                                    <Badge variant="default" className="bg-orange-600">
                                                        Last
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                <div>{entry.scopeName}</div>
                                                <div>
                                                    Position: {entry.position} of {entry.totalStudents}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
