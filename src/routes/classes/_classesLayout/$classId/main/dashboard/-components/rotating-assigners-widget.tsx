/** @format */

import { useMemo } from "react";
import { format } from "date-fns";
import { RotateCw } from "lucide-react";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { AssignmentResult } from "@/lib/assigners/run-random-assigner";

interface RotatingAssignersWidgetProps {
    classId: string;
    studentId: string;
    selectedAssignerIds?: string[] | null; // If null/undefined/empty, show all assigners
}

type RotatingAssignerRun = InstaQLEntity<
    AppSchema,
    "rotating_assigner_runs",
    {
        rotatingAssigner: {};
        class: {};
    }
>;

type RotatingAssignerRunsQueryResult = {
    rotating_assigner_runs: RotatingAssignerRun[];
};

type RotatingAssigner = InstaQLEntity<AppSchema, "rotating_assigners", { class: {} }>;

type RotatingAssignersQueryResult = {
    rotating_assigners: RotatingAssigner[];
};

interface HistoryEntry {
    id: string;
    runId: string;
    assignerId: string;
    assignerName: string;
    runDate: Date | string | number;
    item: string;
    groupOrTeamName: string;
    isTeam: boolean;
    parentGroupName?: string;
}

function HistoryEntryCard({ entry }: { entry: HistoryEntry }) {
    const formattedDate = entry.runDate
        ? format(new Date(entry.runDate), "MMM d, yyyy 'at' h:mm a")
        : "Unknown date";

    return (
        <Card className="mb-2">
            <CardContent className="flex items-start gap-3 p-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{entry.assignerName}</span>
                        <Badge variant="outline" className="text-xs">
                            {entry.item}
                        </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div>{formattedDate}</div>
                        <div className="flex items-center gap-2">
                            <span>
                                {entry.isTeam ? "Team" : "Group"}: {entry.groupOrTeamName}
                            </span>
                            {entry.isTeam && entry.parentGroupName && (
                                <span className="text-muted-foreground">
                                    ({entry.parentGroupName})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function RotatingAssignersWidget({
    classId,
    studentId,
    selectedAssignerIds,
}: RotatingAssignersWidgetProps) {
    // Query all rotating assigner runs for this class
    const { data: runsData } = db.useQuery(
        classId
            ? {
                  rotating_assigner_runs: {
                      $: {
                          where: { "class.id": classId },
                          order: { runDate: "desc" as const },
                      },
                      rotatingAssigner: {},
                      class: {},
                  },
              }
            : null
    );

    // Query assigners to get names
    const { data: assignersData } = db.useQuery(
        classId
            ? {
                  rotating_assigners: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                  },
              }
            : null
    );

    const typedRunsData = (runsData as RotatingAssignerRunsQueryResult | undefined) ?? null;
    const runs = typedRunsData?.rotating_assigner_runs || [];

    const typedAssignersData = (assignersData as RotatingAssignersQueryResult | undefined) ?? null;
    const assigners = typedAssignersData?.rotating_assigners || [];
    const assignerMap = useMemo(() => {
        const map = new Map<string, RotatingAssigner>();
        assigners.forEach((assigner) => {
            map.set(assigner.id, assigner);
        });
        return map;
    }, [assigners]);

    // Process runs: filter by selected assigners, parse results, filter by student
    const historyEntries = useMemo(() => {
        const entries: HistoryEntry[] = [];

        for (const run of runs) {
            // Filter by selected assigner IDs - if empty array, show nothing
            if (selectedAssignerIds !== undefined && selectedAssignerIds !== null) {
                if (selectedAssignerIds.length === 0) {
                    // Empty array means show nothing
                    continue;
                }
                if (!selectedAssignerIds.includes(run.rotatingAssigner?.id || "")) {
                    continue;
                }
            }

            const assigner = run.rotatingAssigner
                ? assignerMap.get(run.rotatingAssigner.id)
                : null;
            if (!assigner) continue;

            // Parse results JSON
            let results: AssignmentResult[] = [];
            try {
                if (run.results) {
                    results = JSON.parse(run.results);
                }
            } catch (error) {
                console.error("Failed to parse assigner run results:", error);
                continue;
            }

            // Filter results for this student
            const studentResults = results.filter(
                (result) => result.studentId === studentId
            );

            // Create history entries
            for (const result of studentResults) {
                entries.push({
                    id: `${run.id}-${result.item}-${result.studentId}`,
                    runId: run.id,
                    assignerId: assigner.id,
                    assignerName: assigner.name,
                    runDate: run.runDate,
                    item: result.item,
                    groupOrTeamName: result.groupOrTeamName,
                    isTeam: result.isTeam,
                    parentGroupName: result.parentGroupName,
                });
            }
        }

        // Sort by date descending
        return entries.sort((a, b) => {
            const dateA = new Date(a.runDate).getTime();
            const dateB = new Date(b.runDate).getTime();
            return dateB - dateA;
        });
    }, [runs, assignerMap, studentId, selectedAssignerIds]);

    // Compute totals: group by assigner, then count items
    const totalsByAssigner = useMemo(() => {
        const assignerTotals = new Map<string, { name: string; items: Map<string, number> }>();

        for (const entry of historyEntries) {
            let assigner = assignerTotals.get(entry.assignerId);
            if (!assigner) {
                assigner = { name: entry.assignerName, items: new Map() };
                assignerTotals.set(entry.assignerId, assigner);
            }
            const currentCount = assigner.items.get(entry.item) || 0;
            assigner.items.set(entry.item, currentCount + 1);
        }

        return Array.from(assignerTotals.entries())
            .map(([id, data]) => ({
                assignerId: id,
                assignerName: data.name,
                items: Array.from(data.items.entries())
                    .map(([item, count]) => ({ item, count }))
                    .sort((a, b) => b.count - a.count), // Sort by count descending
            }))
            .sort((a, b) => a.assignerName.localeCompare(b.assignerName)); // Sort assigners alphabetically
    }, [historyEntries]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RotateCw className="size-5 text-primary" />
                    Rotating Assignments
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="totals" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="totals">Totals</TabsTrigger>
                    </TabsList>
                    <TabsContent value="history" className="mt-0">
                        <ScrollArea className="h-[300px] md:h-[400px]">
                            <div className="pr-4">
                                {historyEntries.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <RotateCw className="size-12 mx-auto mb-2 opacity-50" />
                                        <p>No rotating assignments yet</p>
                                    </div>
                                ) : (
                                    historyEntries.map((entry) => (
                                        <HistoryEntryCard key={entry.id} entry={entry} />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="totals" className="mt-0">
                        <ScrollArea className="h-[300px] md:h-[400px]">
                            <div className="pr-4">
                                {totalsByAssigner.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <RotateCw className="size-12 mx-auto mb-2 opacity-50" />
                                        <p>No rotating assignments yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {totalsByAssigner.map((assigner) => (
                                            <div
                                                key={assigner.assignerId}
                                                className="space-y-2 border-b pb-4 last:border-b-0"
                                            >
                                                <h4 className="font-medium text-sm">
                                                    {assigner.assignerName}
                                                </h4>
                                                <div className="space-y-1">
                                                    {assigner.items.map(({ item, count }) => (
                                                        <div
                                                            key={item}
                                                            className="flex items-center justify-between text-sm pl-2"
                                                        >
                                                            <span className="text-muted-foreground">
                                                                {item}
                                                            </span>
                                                            <Badge variant="secondary">{count}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
