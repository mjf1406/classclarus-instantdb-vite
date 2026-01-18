/** @format */

import { useState, useMemo } from "react";
import React from "react";
import { id } from "@instantdb/react";
import { Trophy, Award, Flag, Gift, Plus, Folder } from "lucide-react";
import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
    Credenza,
    CredenzaTrigger,
    CredenzaContent,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateBehaviorDialog } from "../../behaviors/-components/create-behavior-dialog";
import { CreateRewardItemDialog } from "../../reward-items/-components/create-reward-item-dialog";
import { BehaviorCard } from "../../behaviors/-components/behavior-card";
import { RewardItemCard } from "../../reward-items/-components/reward-item-card";
import { FolderItemsDialog } from "./folder-items-dialog";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ExistingRoster } from "./edit-student-dialog";

interface ApplyActionDialogProps {
    student: InstaQLEntity<AppSchema, "$users">;
    classId: string;
    existingRoster: ExistingRoster;
    totalPoints: number;
    awardedPoints: number;
    removedPoints: number;
    redeemedPoints: number;
    canManage: boolean;
    children: React.ReactNode;
}

type Behavior = InstaQLEntity<AppSchema, "behaviors", { class?: {}; folder?: {} }>;
type RewardItem = InstaQLEntity<AppSchema, "reward_items", { class?: {}; folder?: {} }>;
type FolderType = InstaQLEntity<AppSchema, "folders", { class?: {} }>;

type BehaviorsQueryResult = { behaviors: Behavior[] };
type RewardItemsQueryResult = { reward_items: RewardItem[] };
type FoldersQueryResult = { folders: FolderType[] };

export function ApplyActionDialog({
    student,
    classId,
    existingRoster,
    totalPoints,
    awardedPoints,
    removedPoints,
    redeemedPoints,
    canManage,
    children,
}: ApplyActionDialogProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"award" | "remove" | "redeem">("award");
    const [selectedBehaviorIds, setSelectedBehaviorIds] = useState<Set<string>>(new Set());
    const [selectedRewardItemIds, setSelectedRewardItemIds] = useState<Set<string>>(new Set());
    const [quantity, setQuantity] = useState<string>("1");
    const [applyMode, setApplyMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
    const [folderItemType, setFolderItemType] = useState<"behavior" | "reward">("behavior");
    const { user } = useAuthContext();

    const { data: behaviorsData } = db.useQuery(
        classId
            ? {
                  behaviors: {
                      $: { where: { "class.id": classId } },
                      class: {},
                      folder: {},
                  },
              }
            : null
    );

    const { data: rewardItemsData } = db.useQuery(
        classId
            ? {
                  reward_items: {
                      $: { where: { "class.id": classId } },
                      class: {},
                      folder: {},
                  },
              }
            : null
    );

    const { data: foldersData } = db.useQuery(
        classId
            ? {
                  folders: {
                      $: { where: { "class.id": classId } },
                      class: {},
                  },
              }
            : null
    );

    const typedBehaviors = (behaviorsData as BehaviorsQueryResult | undefined) ?? null;
    const behaviors = typedBehaviors?.behaviors ?? [];

    const typedRewardItems = (rewardItemsData as RewardItemsQueryResult | undefined) ?? null;
    const rewardItems = typedRewardItems?.reward_items ?? [];

    const typedFolders = (foldersData as FoldersQueryResult | undefined) ?? null;
    const folders = (typedFolders?.folders ?? []).sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "")
    );

    // Group behaviors by folder
    const positiveBehaviorsByFolder = useMemo(() => {
        const filtered = behaviors.filter((b) => (b.points ?? 0) >= 0);
        const grouped = new Map<string, Behavior[]>();
        
        for (const behavior of filtered) {
            if (behavior.folder?.id) {
                const folderId = behavior.folder.id;
                if (!grouped.has(folderId)) {
                    grouped.set(folderId, []);
                }
                grouped.get(folderId)!.push(behavior);
            }
        }
        
        // Sort items within each folder
        for (const [, items] of grouped.entries()) {
            items.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        }
        
        return grouped;
    }, [behaviors]);

    const positiveBehaviorsUncategorized = useMemo(() => {
        const filtered = behaviors.filter((b) => (b.points ?? 0) >= 0 && !b.folder);
        return filtered.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }, [behaviors]);

    const negativeBehaviorsByFolder = useMemo(() => {
        const filtered = behaviors.filter((b) => (b.points ?? 0) < 0);
        const grouped = new Map<string, Behavior[]>();
        
        for (const behavior of filtered) {
            if (behavior.folder?.id) {
                const folderId = behavior.folder.id;
                if (!grouped.has(folderId)) {
                    grouped.set(folderId, []);
                }
                grouped.get(folderId)!.push(behavior);
            }
        }
        
        // Sort items within each folder
        for (const [, items] of grouped.entries()) {
            items.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        }
        
        return grouped;
    }, [behaviors]);

    const negativeBehaviorsUncategorized = useMemo(() => {
        const filtered = behaviors.filter((b) => (b.points ?? 0) < 0 && !b.folder);
        return filtered.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }, [behaviors]);

    const rewardItemsByFolder = useMemo(() => {
        const grouped = new Map<string, RewardItem[]>();
        
        for (const rewardItem of rewardItems) {
            if (rewardItem.folder?.id) {
                const folderId = rewardItem.folder.id;
                if (!grouped.has(folderId)) {
                    grouped.set(folderId, []);
                }
                grouped.get(folderId)!.push(rewardItem);
            }
        }
        
        // Sort items within each folder
        for (const [, items] of grouped.entries()) {
            items.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        }
        
        return grouped;
    }, [rewardItems]);

    const rewardItemsUncategorized = useMemo(() => {
        const filtered = rewardItems.filter((r) => !r.folder);
        return filtered.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }, [rewardItems]);

    const rosterNumber = existingRoster?.number;
    const firstName = (existingRoster?.firstName ?? student.firstName)?.trim() || "—";
    const lastName = (existingRoster?.lastName ?? student.lastName)?.trim() || "";
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;
    const gender = (existingRoster?.gender ?? student.gender)?.trim() || "—";

    const applyAction = async (behaviorIds?: string[], rewardItemIds?: string[]) => {
        if (!user?.id || !canManage) return;

        const qty = Number(quantity);
        if (Number.isNaN(qty) || qty < 1) {
            return;
        }

        const targetBehaviorIds = behaviorIds ?? Array.from(selectedBehaviorIds);
        const targetRewardItemIds = rewardItemIds ?? Array.from(selectedRewardItemIds);

        setIsSubmitting(true);

        try {
            const transactions: any[] = [];

            // Apply all selected behaviors
            for (const behaviorId of targetBehaviorIds) {
                const newId = id();
                transactions.push(
                    db.tx.behavior_logs[newId]
                        .create({
                            createdAt: new Date(),
                            quantity: qty,
                        })
                        .link({ class: classId })
                        .link({ behavior: behaviorId })
                        .link({ student: student.id })
                        .link({ createdBy: user.id })
                );
            }

            // Apply all selected reward items
            for (const rewardItemId of targetRewardItemIds) {
                const newId = id();
                transactions.push(
                    db.tx.reward_redemptions[newId]
                        .create({
                            createdAt: new Date(),
                            quantity: qty,
                        })
                        .link({ class: classId })
                        .link({ rewardItem: rewardItemId })
                        .link({ student: student.id })
                        .link({ createdBy: user.id })
                );
            }

            if (transactions.length > 0) {
                db.transact(transactions);
            }

            setOpen(false);
            setSelectedBehaviorIds(new Set());
            setSelectedRewardItemIds(new Set());
            setQuantity("1");
            setApplyMode(false);
        } catch (err) {
            console.error("Failed to apply action:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApply = async () => {
        await applyAction();
    };

    const handleBehaviorClick = (behaviorId: string) => {
        if (applyMode) {
            setSelectedBehaviorIds((prev) => {
                const next = new Set(prev);
                if (next.has(behaviorId)) {
                    next.delete(behaviorId);
                } else {
                    next.add(behaviorId);
                }
                return next;
            });
        } else {
            applyAction([behaviorId], []);
        }
    };

    const handleRewardItemClick = (rewardItemId: string) => {
        if (applyMode) {
            setSelectedRewardItemIds((prev) => {
                const next = new Set(prev);
                if (next.has(rewardItemId)) {
                    next.delete(rewardItemId);
                } else {
                    next.add(rewardItemId);
                }
                return next;
            });
        } else {
            applyAction([], [rewardItemId]);
        }
    };

    const handleFolderClick = (folder: FolderType, itemType: "behavior" | "reward") => {
        setSelectedFolder(folder);
        setFolderItemType(itemType);
        setFolderDialogOpen(true);
    };

    const handleSelectionChange = (
        behaviorIds: Set<string>,
        rewardItemIds: Set<string>
    ) => {
        setSelectedBehaviorIds(behaviorIds);
        setSelectedRewardItemIds(rewardItemIds);
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setSelectedBehaviorIds(new Set());
            setSelectedRewardItemIds(new Set());
            setQuantity("1");
            setActiveTab("award");
            setApplyMode(false);
        }
    };

    // Don't reset selections when tab changes - preserve them across tabs
    const handleTabChange = (value: string) => {
        setActiveTab(value as typeof activeTab);
    };

    const canApply =
        applyMode &&
        canManage &&
        user?.id &&
        (selectedBehaviorIds.size > 0 || selectedRewardItemIds.size > 0) &&
        !Number.isNaN(Number(quantity)) &&
        Number(quantity) >= 1;

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild className="hidden">
                <button type="button" aria-hidden="true" />
            </CredenzaTrigger>
            <div
                onClick={() => {
                    // Open dialog when clicking the card (action menu stops propagation)
                    if (canManage) {
                        setOpen(true);
                    }
                }}
                className="w-full"
            >
                {children}
            </div>
            <CredenzaContent className="max-w-4xl">
                <CredenzaHeader>
                    <div className="relative w-full">
                        {rosterNumber !== undefined && rosterNumber !== null && (
                            <span className="absolute top-0 left-0 text-sm text-muted-foreground">
                                #{rosterNumber}
                            </span>
                        )}
                        <div className="flex-1">
                            <CredenzaTitle className="text-center text-2xl">
                                {fullName}
                            </CredenzaTitle>
                            <p className="text-center text-sm text-muted-foreground mb-4">
                                {gender}
                            </p>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Trophy className="size-8 text-yellow-500" />
                                <span className="text-2xl font-semibold">{totalPoints}</span>
                            </div>
                            <div className="flex items-center justify-center gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <Award className="size-6 text-muted-foreground" />
                                    <span className="text-lg">{awardedPoints}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Flag className="size-6 text-muted-foreground" />
                                    <span className="text-lg">-{removedPoints}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Gift className="size-6 text-muted-foreground" />
                                    <span className="text-lg">{redeemedPoints}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CredenzaHeader>
                <CredenzaBody>
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="award">Award Points</TabsTrigger>
                            <TabsTrigger value="remove">Remove Points</TabsTrigger>
                            <TabsTrigger value="redeem">Redeem Points</TabsTrigger>
                        </TabsList>
                        <TabsContent value="award" className="space-y-4 mt-4">
                            {canManage && (
                                <CreateBehaviorDialog classId={classId}>
                                    <Button variant="outline" size="sm">
                                        <Plus className="size-4 mr-2" />
                                        Create Behavior
                                    </Button>
                                </CreateBehaviorDialog>
                            )}
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="quantity-award">Quantity</Label>
                                        <NumberInput
                                            id="quantity-award"
                                            min={1}
                                            step={1}
                                            value={quantity}
                                            onChange={setQuantity}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="apply-mode-award"
                                            checked={applyMode}
                                            onChange={(e) => setApplyMode(e.target.checked)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <Label htmlFor="apply-mode-award" className="cursor-pointer">
                                            Multi-select
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 min-h-[350px]">
                                {/* Folders */}
                                {folders
                                    .filter((folder) => positiveBehaviorsByFolder.has(folder.id))
                                    .map((folder) => {
                                        const folderBehaviors = positiveBehaviorsByFolder.get(folder.id) ?? [];
                                        return (
                                            <Card
                                                key={folder.id}
                                                onClick={() => handleFolderClick(folder, "behavior")}
                                                className="cursor-pointer hover:ring-2 h-[150px] hover:ring-primary transition-all"
                                            >
                                                <CardContent className="flex flex-col items-center justify-center pt-3 pb-3 text-center min-h-[120px]">
                                                    {folder.icon ? (
                                                        <FontAwesomeIconFromId
                                                            id={folder.icon}
                                                            className="size-8 text-primary mb-2"
                                                            fallback={<Folder className="size-8 text-primary mb-2" />}
                                                        />
                                                    ) : (
                                                        <Folder className="size-8 text-primary mb-2" />
                                                    )}
                                                    <span className="font-medium text-sm mb-1">{folder.name}</span>
                                                    <Badge variant="secondary">{folderBehaviors.length}</Badge>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                {/* Uncategorized items */}
                                {positiveBehaviorsUncategorized.map((behavior) => (
                                    <div
                                        key={behavior.id}
                                        onClick={() => handleBehaviorClick(behavior.id)}
                                        className={`cursor-pointer transition-all ${
                                            selectedBehaviorIds.has(behavior.id)
                                                ? "ring-2 ring-primary rounded-lg"
                                                : ""
                                        }`}
                                    >
                                        <BehaviorCard
                                            behavior={behavior}
                                            classId={classId}
                                            canManage={false}
                                            preferMobile
                                        />
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="remove" className="space-y-4 mt-4">
                            {canManage && (
                                <CreateBehaviorDialog classId={classId}>
                                    <Button variant="outline" size="sm">
                                        <Plus className="size-4 mr-2" />
                                        Create Behavior
                                    </Button>
                                </CreateBehaviorDialog>
                            )}
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="quantity-remove">Quantity</Label>
                                        <NumberInput
                                            id="quantity-remove"
                                            min={1}
                                            step={1}
                                            value={quantity}
                                            onChange={setQuantity}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="apply-mode-remove"
                                            checked={applyMode}
                                            onChange={(e) => setApplyMode(e.target.checked)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <Label htmlFor="apply-mode-remove" className="cursor-pointer">
                                            Multi-select
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 min-h-[350px]">
                                {/* Folders */}
                                {folders
                                    .filter((folder) => negativeBehaviorsByFolder.has(folder.id))
                                    .map((folder) => {
                                        const folderBehaviors = negativeBehaviorsByFolder.get(folder.id) ?? [];
                                        return (
                                            <Card
                                                key={folder.id}
                                                onClick={() => handleFolderClick(folder, "behavior")}
                                                className="cursor-pointer hover:ring-2 hover:ring-primary transition-all h-[150px]"
                                            >
                                                <CardContent className="flex flex-col items-center justify-center pt-3 pb-3 text-center min-h-[120px]">
                                                    {folder.icon ? (
                                                        <FontAwesomeIconFromId
                                                            id={folder.icon}
                                                            className="size-8 text-primary mb-2"
                                                            fallback={<Folder className="size-8 text-primary mb-2" />}
                                                        />
                                                    ) : (
                                                        <Folder className="size-8 text-primary mb-2" />
                                                    )}
                                                    <span className="font-medium text-sm mb-1">{folder.name}</span>
                                                    <Badge variant="secondary">{folderBehaviors.length}</Badge>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                {/* Uncategorized items */}
                                {negativeBehaviorsUncategorized.map((behavior) => (
                                    <div
                                        key={behavior.id}
                                        onClick={() => handleBehaviorClick(behavior.id)}
                                        className={`cursor-pointer h-[150px] transition-all ${
                                            selectedBehaviorIds.has(behavior.id)
                                                ? "ring-2 ring-primary rounded-lg"
                                                : ""
                                        }`}
                                    >
                                        <BehaviorCard
                                            behavior={behavior}
                                            classId={classId}
                                            canManage={false}
                                            preferMobile
                                        />
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="redeem" className="space-y-4 mt-4">
                            {canManage && (
                                <CreateRewardItemDialog classId={classId}>
                                    <Button variant="outline" size="sm">
                                        <Plus className="size-4 mr-2" />
                                        Create Reward Item
                                    </Button>
                                </CreateRewardItemDialog>
                            )}
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="quantity-redeem">Quantity</Label>
                                        <NumberInput
                                            id="quantity-redeem"
                                            min={1}
                                            step={1}
                                            value={quantity}
                                            onChange={setQuantity}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="apply-mode-redeem"
                                            checked={applyMode}
                                            onChange={(e) => setApplyMode(e.target.checked)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <Label htmlFor="apply-mode-redeem" className="cursor-pointer">
                                            Multi-select
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 min-h-[350px]">
                                {/* Folders */}
                                {folders
                                    .filter((folder) => rewardItemsByFolder.has(folder.id))
                                    .map((folder) => {
                                        const folderRewardItems = rewardItemsByFolder.get(folder.id) ?? [];
                                        return (
                                            <Card
                                                key={folder.id}
                                                onClick={() => handleFolderClick(folder, "reward")}
                                                className="cursor-pointer hover:ring-2 h-[150px] hover:ring-primary transition-all"
                                            >
                                                <CardContent className="flex flex-col items-center justify-center pt-3 pb-3 text-center min-h-[120px]">
                                                    {folder.icon ? (
                                                        <FontAwesomeIconFromId
                                                            id={folder.icon}
                                                            className="size-8 text-primary mb-2"
                                                            fallback={<Folder className="size-8 text-primary mb-2" />}
                                                        />
                                                    ) : (
                                                        <Folder className="size-8 text-primary mb-2" />
                                                    )}
                                                    <span className="font-medium text-sm mb-1">{folder.name}</span>
                                                    <Badge variant="secondary">{folderRewardItems.length}</Badge>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                {/* Uncategorized items */}
                                {rewardItemsUncategorized.map((rewardItem) => (
                                    <div
                                        key={rewardItem.id}
                                        onClick={() => handleRewardItemClick(rewardItem.id)}
                                        className={`cursor-pointer h-[150px] transition-all ${
                                            selectedRewardItemIds.has(rewardItem.id)
                                                ? "ring-2 ring-primary rounded-lg"
                                                : ""
                                        }`}
                                    >
                                        <RewardItemCard
                                            rewardItem={rewardItem}
                                            classId={classId}
                                            canManage={false}
                                            preferMobile
                                        />
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                    {canApply && (
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleApply} disabled={isSubmitting}>
                                {isSubmitting
                                    ? "Applying..."
                                    : (() => {
                                          const totalSelections =
                                              selectedBehaviorIds.size +
                                              selectedRewardItemIds.size;
                                          const actionText =
                                              selectedRewardItemIds.size > 0
                                                  ? "Redeem"
                                                  : "Apply";
                                          return totalSelections > 1
                                              ? `${actionText} ${totalSelections} items`
                                              : actionText;
                                      })()}
                            </Button>
                        </div>
                    )}
                </CredenzaBody>
            </CredenzaContent>
            {selectedFolder && (
                <FolderItemsDialog
                    open={folderDialogOpen}
                    onOpenChange={setFolderDialogOpen}
                    folder={selectedFolder}
                    items={
                        folderItemType === "behavior"
                            ? activeTab === "award"
                                ? (selectedFolder.id && positiveBehaviorsByFolder.has(selectedFolder.id)
                                      ? positiveBehaviorsByFolder.get(selectedFolder.id)!
                                      : [])
                                : (selectedFolder.id && negativeBehaviorsByFolder.has(selectedFolder.id)
                                      ? negativeBehaviorsByFolder.get(selectedFolder.id)!
                                      : [])
                            : selectedFolder.id && rewardItemsByFolder.has(selectedFolder.id)
                              ? rewardItemsByFolder.get(selectedFolder.id)!
                              : []
                    }
                    itemType={folderItemType}
                    classId={classId}
                    quantity={quantity}
                    applyMode={applyMode}
                    selectedBehaviorIds={selectedBehaviorIds}
                    selectedRewardItemIds={selectedRewardItemIds}
                    onSelectionChange={handleSelectionChange}
                    onApply={applyAction}
                    onCloseParent={() => setOpen(false)}
                />
            )}
        </Credenza>
    );
}
