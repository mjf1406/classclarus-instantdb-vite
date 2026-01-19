/** @format */

import { useMemo } from "react";
import { format } from "date-fns";
import { Trophy, Award, Flag, Gift } from "lucide-react";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type BehaviorLog = InstaQLEntity<AppSchema, "behavior_logs", { behavior?: {}; student?: {}; createdBy?: {} }>;
type RewardRedemption = InstaQLEntity<AppSchema, "reward_redemptions", { rewardItem?: {}; student?: {}; createdBy?: {} }>;

type BehaviorLogsQueryResult = {
    behavior_logs: BehaviorLog[];
};

type RewardRedemptionsQueryResult = {
    reward_redemptions: RewardRedemption[];
};

interface PointsWidgetProps {
    classId: string;
    studentId: string;
}

interface HistoryEntryProps {
    date: Date | string | number | null | undefined;
    name: string;
    points: number;
    quantity: number;
    createdBy?: InstaQLEntity<AppSchema, "$users"> | null;
    icon?: string | null;
}

function HistoryEntry({ date, name, points, quantity, createdBy, icon }: HistoryEntryProps) {
    const formattedDate = date
        ? format(new Date(date), "MMM d, yyyy 'at' h:mm a")
        : "Unknown date";
    const pointsStr = points >= 0 ? `+${points}` : String(points);
    const createdByName =
        createdBy?.firstName || createdBy?.lastName
            ? `${createdBy.firstName ?? ""} ${createdBy.lastName ?? ""}`.trim() || createdBy.email
            : createdBy?.email ?? "Unknown";

    return (
        <Card className="mb-2">
            <CardContent className="flex items-center gap-3 p-3">
                {icon && (
                    <div className="shrink-0">
                        <FontAwesomeIconFromId
                            id={icon}
                            className="size-5 text-primary"
                            fallback={<Award className="size-5 text-primary" />}
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{name}</span>
                        <Badge variant="secondary" className="text-xs">
                            {pointsStr}
                        </Badge>
                        {quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                                ×{quantity}
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <div>{formattedDate}</div>
                        <div>By: {createdByName}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function PointsWidget({ classId, studentId }: PointsWidgetProps) {
    // Query behavior logs for the student with ordering and createdBy
    const { data: behaviorLogsData } = db.useQuery(
        classId && studentId
            ? {
                  behavior_logs: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": studentId },
                              ],
                          },
                          order: { createdAt: "desc" },
                      },
                      behavior: {},
                      student: {},
                      createdBy: {},
                  },
              }
            : null
    );

    // Query reward redemptions for the student with ordering and createdBy
    const { data: rewardRedemptionsData } = db.useQuery(
        classId && studentId
            ? {
                  reward_redemptions: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": studentId },
                              ],
                          },
                          order: { createdAt: "desc" },
                      },
                      rewardItem: {},
                      student: {},
                      createdBy: {},
                  },
              }
            : null
    );

    const typedBehaviorLogs = (behaviorLogsData as BehaviorLogsQueryResult | undefined) ?? null;
    const behaviorLogs = typedBehaviorLogs?.behavior_logs ?? [];

    const typedRewardRedemptions = (rewardRedemptionsData as RewardRedemptionsQueryResult | undefined) ?? null;
    const rewardRedemptions = typedRewardRedemptions?.reward_redemptions ?? [];

    // Calculate points aggregates
    const { totalPoints, awardedPoints, removedPoints, redeemedPoints } = useMemo(() => {
        let awarded = 0;
        let removed = 0;
        let redeemed = 0;

        // Calculate from behavior logs
        for (const log of behaviorLogs) {
            const points = log.behavior?.points ?? 0;
            const qty = (log.quantity ?? 1) as number;
            if (points >= 0) {
                awarded += points * qty;
            } else {
                removed += Math.abs(points) * qty;
            }
        }

        // Calculate from reward redemptions
        for (const redemption of rewardRedemptions) {
            const cost = redemption.rewardItem?.cost ?? 0;
            const qty = (redemption.quantity ?? 1) as number;
            redeemed += cost * qty;
        }

        const total = awarded - removed - redeemed;

        return {
            totalPoints: total,
            awardedPoints: awarded,
            removedPoints: removed,
            redeemedPoints: redeemed,
        };
    }, [behaviorLogs, rewardRedemptions]);

    // Create history entries
    const awardedEntries = useMemo(() => {
        return behaviorLogs
            .filter((log) => (log.behavior?.points ?? 0) >= 0)
            .map((log) => ({
                id: log.id,
                date: log.createdAt,
                name: log.behavior?.name ?? "Unknown Behavior",
                points: (log.behavior?.points ?? 0) * ((log.quantity ?? 1) as number),
                quantity: (log.quantity ?? 1) as number,
                createdBy: log.createdBy,
                icon: log.behavior?.icon ?? null,
            }));
    }, [behaviorLogs]);

    const removedEntries = useMemo(() => {
        return behaviorLogs
            .filter((log) => (log.behavior?.points ?? 0) < 0)
            .map((log) => ({
                id: log.id,
                date: log.createdAt,
                name: log.behavior?.name ?? "Unknown Behavior",
                points: (log.behavior?.points ?? 0) * ((log.quantity ?? 1) as number),
                quantity: (log.quantity ?? 1) as number,
                createdBy: log.createdBy,
                icon: log.behavior?.icon ?? null,
            }));
    }, [behaviorLogs]);

    const redeemedEntries = useMemo(() => {
        return rewardRedemptions.map((redemption) => ({
            id: redemption.id,
            date: redemption.createdAt,
            name: redemption.rewardItem?.name ?? "Unknown Reward",
            points: (redemption.rewardItem?.cost ?? 0) * ((redemption.quantity ?? 1) as number),
            quantity: (redemption.quantity ?? 1) as number,
            createdBy: redemption.createdBy,
            icon: redemption.rewardItem?.icon ?? null,
        }));
    }, [rewardRedemptions]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="size-5 text-yellow-500" />
                    Points
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Points - Prominent Display */}
                <div className="flex items-center justify-center gap-2 py-4">
                    <Trophy className="size-8 md:size-10 text-yellow-500" />
                    <span className="text-3xl md:text-4xl font-semibold">{totalPoints}</span>
                </div>

                {/* Breakdown Stats */}
                <div className="flex items-center justify-center gap-3 md:gap-6 pt-2 border-t">
                    <div className="flex items-center gap-1 md:gap-2">
                        <Award className="size-4 md:size-5 text-muted-foreground" />
                        <span className="text-sm md:text-base font-medium">{awardedPoints}</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                        <Flag className="size-4 md:size-5 text-muted-foreground" />
                        <span className="text-sm md:text-base font-medium">-{removedPoints}</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                        <Gift className="size-4 md:size-5 text-muted-foreground" />
                        <span className="text-sm md:text-base font-medium">{redeemedPoints}</span>
                    </div>
                </div>

                {/* History Tabs */}
                <Tabs defaultValue="awarded" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-9 md:h-10">
                        <TabsTrigger value="awarded" className="text-xs md:text-sm">
                            Awarded
                        </TabsTrigger>
                        <TabsTrigger value="removed" className="text-xs md:text-sm">
                            Removed
                        </TabsTrigger>
                        <TabsTrigger value="redeemed" className="text-xs md:text-sm">
                            Redeemed
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="awarded" className="mt-4">
                        <ScrollArea className="h-[300px] md:h-[400px]">
                            <div className="pr-4">
                                {awardedEntries.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Award className="size-12 mx-auto mb-2 opacity-50" />
                                        <p>No points awarded yet</p>
                                    </div>
                                ) : (
                                    awardedEntries.map((entry) => (
                                        <HistoryEntry
                                            key={entry.id}
                                            date={entry.date}
                                            name={entry.name}
                                            points={entry.points}
                                            quantity={entry.quantity}
                                            createdBy={entry.createdBy}
                                            icon={entry.icon}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="removed" className="mt-4">
                        <ScrollArea className="h-[300px] md:h-[400px]">
                            <div className="pr-4">
                                {removedEntries.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Flag className="size-12 mx-auto mb-2 opacity-50" />
                                        <p>No points removed yet</p>
                                    </div>
                                ) : (
                                    removedEntries.map((entry) => (
                                        <HistoryEntry
                                            key={entry.id}
                                            date={entry.date}
                                            name={entry.name}
                                            points={entry.points}
                                            quantity={entry.quantity}
                                            createdBy={entry.createdBy}
                                            icon={entry.icon}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="redeemed" className="mt-4">
                        <ScrollArea className="h-[300px] md:h-[400px]">
                            <div className="pr-4">
                                {redeemedEntries.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Gift className="size-12 mx-auto mb-2 opacity-50" />
                                        <p>No points redeemed yet</p>
                                    </div>
                                ) : (
                                    redeemedEntries.map((entry) => (
                                        <HistoryEntry
                                            key={entry.id}
                                            date={entry.date}
                                            name={entry.name}
                                            points={-entry.points}
                                            quantity={entry.quantity}
                                            createdBy={entry.createdBy}
                                            icon={entry.icon}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
