/** @format */

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Award, Flag, Gift, Trash2 } from "lucide-react";
import { db } from "@/lib/db/db";
import {
    Credenza,
    CredenzaTrigger,
    CredenzaContent,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ExistingRoster } from "./edit-student-dialog";

interface PointHistoryDialogProps {
    student: InstaQLEntity<AppSchema, "$users">;
    classId: string;
    existingRoster: ExistingRoster;
    canManage: boolean;
    children: React.ReactNode;
}

type BehaviorLog = InstaQLEntity<
    AppSchema,
    "behavior_logs",
    { behavior?: {}; student?: {}; createdBy?: {}; class?: {} }
>;

type RewardRedemption = InstaQLEntity<
    AppSchema,
    "reward_redemptions",
    { rewardItem?: {}; student?: {}; createdBy?: {}; class?: {} }
>;

type BehaviorLogsQueryResult = { behavior_logs: BehaviorLog[] };
type RewardRedemptionsQueryResult = { reward_redemptions: RewardRedemption[] };

interface HistoryEntryProps {
    id: string;
    type: "behavior" | "redemption";
    date: Date | string | number | null | undefined;
    name: string;
    points: number;
    quantity: number;
    createdBy?: InstaQLEntity<AppSchema, "$users"> | null;
    icon?: string | null;
    canManage: boolean;
    onDelete: (id: string, type: "behavior" | "redemption", description: string) => void;
}

function HistoryEntry({
    id,
    type,
    date,
    name,
    points,
    quantity,
    createdBy,
    icon,
    canManage,
    onDelete,
}: HistoryEntryProps) {
    const formattedDate = date
        ? format(new Date(date), "MMM d, yyyy 'at' h:mm a")
        : "Unknown date";
    const pointsStr = points >= 0 ? `+${points}` : String(points);
    const createdByName =
        createdBy?.firstName || createdBy?.lastName
            ? `${createdBy.firstName ?? ""} ${createdBy.lastName ?? ""}`.trim() || createdBy.email
            : createdBy?.email ?? "Unknown";

    const description = `${type === "behavior" ? "Behavior" : "Reward"}: ${name} (${pointsStr})`;

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
                {canManage && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(id, type, description)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export function PointHistoryDialog({
    student,
    classId,
    existingRoster,
    canManage,
    children,
}: PointHistoryDialogProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{
        id: string;
        type: "behavior" | "redemption";
        description: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { data: behaviorLogsData } = db.useQuery(
        classId && student.id
            ? {
                  behavior_logs: {
                      $: {
                          where: {
                              "student.id": student.id,
                              "class.id": classId,
                          },
                          order: { createdAt: "desc" },
                      },
                      behavior: {},
                      student: {},
                      createdBy: {},
                      class: {},
                  },
              }
            : null
    );

    const { data: rewardRedemptionsData } = db.useQuery(
        classId && student.id
            ? {
                  reward_redemptions: {
                      $: {
                          where: {
                              "student.id": student.id,
                              "class.id": classId,
                          },
                          order: { createdAt: "desc" },
                      },
                      rewardItem: {},
                      student: {},
                      createdBy: {},
                      class: {},
                  },
              }
            : null
    );

    const typedBehaviorLogs = (behaviorLogsData as BehaviorLogsQueryResult | undefined) ?? null;
    const behaviorLogs = typedBehaviorLogs?.behavior_logs ?? [];

    const typedRewardRedemptions =
        (rewardRedemptionsData as RewardRedemptionsQueryResult | undefined) ?? null;
    const rewardRedemptions = typedRewardRedemptions?.reward_redemptions ?? [];

    const awardedEntries = useMemo(() => {
        return behaviorLogs
            .filter((log) => (log.behavior?.points ?? 0) >= 0)
            .map((log) => ({
                id: log.id,
                type: "behavior" as const,
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
                type: "behavior" as const,
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
            type: "redemption" as const,
            date: redemption.createdAt,
            name: redemption.rewardItem?.name ?? "Unknown Reward",
            points: (redemption.rewardItem?.cost ?? 0) * ((redemption.quantity ?? 1) as number),
            quantity: (redemption.quantity ?? 1) as number,
            createdBy: redemption.createdBy,
            icon: redemption.rewardItem?.icon ?? null,
        }));
    }, [rewardRedemptions]);

    const handleDeleteClick = (id: string, type: "behavior" | "redemption", description: string) => {
        setPendingDelete({ id, type, description });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDelete) return;

        setIsDeleting(true);
        try {
            if (pendingDelete.type === "behavior") {
                db.transact([db.tx.behavior_logs[pendingDelete.id].delete()]);
            } else {
                db.transact([db.tx.reward_redemptions[pendingDelete.id].delete()]);
            }
            setDeleteDialogOpen(false);
            setPendingDelete(null);
        } catch (err) {
            console.error("Failed to delete action:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const rosterNumber = existingRoster?.number;
    const firstName = (existingRoster?.firstName ?? student.firstName)?.trim() || "—";
    const lastName = (existingRoster?.lastName ?? student.lastName)?.trim() || "";
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    return (
        <Credenza>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="max-w-2xl">
                <CredenzaHeader>
                    <CredenzaTitle className="text-center text-lg md:text-2xl">
                        Point History - {fullName}
                    </CredenzaTitle>
                    {rosterNumber !== undefined && rosterNumber !== null && (
                        <p className="text-center text-xs md:text-sm text-muted-foreground">
                            #{rosterNumber}
                        </p>
                    )}
                </CredenzaHeader>
                <CredenzaBody>
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
                            <ScrollArea className="h-[400px] md:h-[500px]">
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
                                                id={entry.id}
                                                type={entry.type}
                                                date={entry.date}
                                                name={entry.name}
                                                points={entry.points}
                                                quantity={entry.quantity}
                                                createdBy={entry.createdBy}
                                                icon={entry.icon}
                                                canManage={canManage}
                                                onDelete={handleDeleteClick}
                                            />
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="removed" className="mt-4">
                            <ScrollArea className="h-[400px] md:h-[500px]">
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
                                                id={entry.id}
                                                type={entry.type}
                                                date={entry.date}
                                                name={entry.name}
                                                points={entry.points}
                                                quantity={entry.quantity}
                                                createdBy={entry.createdBy}
                                                icon={entry.icon}
                                                canManage={canManage}
                                                onDelete={handleDeleteClick}
                                            />
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="redeemed" className="mt-4">
                            <ScrollArea className="h-[400px] md:h-[500px]">
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
                                                id={entry.id}
                                                type={entry.type}
                                                date={entry.date}
                                                name={entry.name}
                                                points={-entry.points}
                                                quantity={entry.quantity}
                                                createdBy={entry.createdBy}
                                                icon={entry.icon}
                                                canManage={canManage}
                                                onDelete={handleDeleteClick}
                                            />
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CredenzaBody>
            </CredenzaContent>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove: {pendingDelete?.description}. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Credenza>
    );
}
