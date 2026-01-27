/** @format */

import { useMemo } from "react";
import { format } from "date-fns";
import { Hand } from "lucide-react";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface PickerHistoryWidgetProps {
    classId: string;
    studentId: string;
}

type PickerPick = InstaQLEntity<
    AppSchema,
    "picker_picks",
    {
        round: {
            class: {};
        };
    }
>;

type PickerPicksQueryResult = {
    picker_picks: PickerPick[];
};

export function PickerHistoryWidget({
    classId,
    studentId,
}: PickerHistoryWidgetProps) {
    // Query all picker picks for the student
    const { data: picksData } = db.useQuery(
        studentId
            ? {
                  picker_picks: {
                      $: {
                          where: { studentId: studentId },
                          order: { pickedAt: "desc" as const },
                      },
                      round: {
                          class: {},
                      },
                  },
              }
            : null
    );

    const typedPicksData = (picksData as PickerPicksQueryResult | undefined) ?? null;
    const allPicks = typedPicksData?.picker_picks ?? [];

    // Filter picks for this class only
    const studentPicks = useMemo(() => {
        return allPicks
            .filter((pick) => pick.round?.class?.id === classId)
            .map((pick) => ({
                pickId: pick.id,
                pickedAt: new Date(pick.pickedAt),
                position: pick.position,
                scopeName: pick.round?.scopeName ?? "Unknown",
            }));
    }, [allPicks, classId]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalPicks = studentPicks.length;
        const positionCounts = new Map<number, number>();

        for (const pick of studentPicks) {
            const count = positionCounts.get(pick.position) ?? 0;
            positionCounts.set(pick.position, count + 1);
        }

        // Get top 3 positions
        const topPositions = Array.from(positionCounts.entries())
            .sort((a, b) => a[0] - b[0])
            .slice(0, 3);

        return {
            totalPicks,
            positionCounts,
            topPositions,
        };
    }, [studentPicks]);

    // Format position as ordinal (1st, 2nd, 3rd, etc.)
    const formatPosition = (position: number): string => {
        const suffix = position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th";
        return `${position}${suffix}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Hand className="size-5 text-primary" />
                    Pick History
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistics */}
                <div className="flex items-center justify-center gap-3 md:gap-6 pt-2 border-t">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold">
                            {stats.totalPicks}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Total Picks
                        </span>
                    </div>
                    {stats.topPositions.length > 0 && (
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex gap-1">
                                {stats.topPositions.map(([position, count]) => (
                                    <div key={position} className="flex flex-col items-center">
                                        <span className="text-lg md:text-xl font-semibold">
                                            {count}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatPosition(position)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Position Breakdown
                            </span>
                        </div>
                    )}
                </div>

                {/* History List */}
                <ScrollArea className="h-[300px] md:h-[400px]">
                    <div className="pr-4 space-y-2">
                        {studentPicks.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Hand className="size-12 mx-auto mb-2 opacity-50" />
                                <p>No pick history yet</p>
                            </div>
                        ) : (
                            studentPicks.map((entry) => (
                                <Card key={entry.pickId} className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">
                                                    {format(entry.pickedAt, "MMM d, yyyy 'at' h:mm a")}
                                                </span>
                                                <Badge variant="secondary">
                                                    {formatPosition(entry.position)}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {entry.scopeName}
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
