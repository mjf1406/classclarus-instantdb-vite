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
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface ActionTabControlsProps {
    quantityId: string;
    applyModeId: string;
    quantity: string;
    setQuantity: React.Dispatch<React.SetStateAction<string>>;
    applyMode: boolean;
    setApplyMode: React.Dispatch<React.SetStateAction<boolean>>;
    isSubmitting: boolean;
    createAction?: React.ReactNode;
}

function ActionTabControls({
    quantityId,
    applyModeId,
    quantity,
    setQuantity,
    applyMode,
    setApplyMode,
    isSubmitting,
    createAction,
}: ActionTabControlsProps) {
    return (
        <div className="flex items-end gap-2 md:gap-4">
            {createAction}
            <div className="flex-1 space-y-1 md:space-y-2">
                <Label htmlFor={quantityId} className="text-xs sr-only md:text-sm">
                    Quantity
                </Label>
                <NumberInput
                    id={quantityId}
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={setQuantity}
                    disabled={isSubmitting}
                    className="h-8 md:h-10 text-sm md:text-base"
                />
            </div>
            <div className="flex items-center gap-1 md:gap-2 pb-1 md:pb-2">
                <input
                    type="checkbox"
                    id={applyModeId}
                    checked={applyMode}
                    onChange={(e) => setApplyMode(e.target.checked)}
                    className="h-3 w-3 md:h-4 md:w-4 rounded border-input"
                />
                <Label htmlFor={applyModeId} className="cursor-pointer text-xs md:text-sm">
                    Multi-select
                </Label>
            </div>
        </div>
    );
}

interface FolderCardButtonProps {
    folder: FolderType;
    count: number;
    onClick: () => void;
}

function FolderCardButton({ folder, count, onClick }: FolderCardButtonProps) {
    return (
        <Card
            onClick={onClick}
            className="cursor-pointer hover:ring-2 h-[90px] md:h-[150px] hover:ring-primary transition-all"
        >
            <CardContent className="flex flex-col items-center justify-center pt-0.5 pb-0.5 md:pt-3 md:pb-3 text-center min-h-[80px] md:min-h-[120px]">
                {folder.icon ? (
                    <FontAwesomeIconFromId
                        id={folder.icon}
                        className="size-5 md:size-8 text-primary mb-0 md:mb-2"
                        fallback={<Folder className="size-5 md:size-8 text-primary mb-0 md:mb-2" />}
                    />
                ) : (
                    <Folder className="size-5 md:size-8 text-primary mb-0 md:mb-2" />
                )}
                <span className="font-medium text-[10px] md:text-sm mb-0 md:mb-1">{folder.name}</span>
                <Badge variant="secondary" className="text-[10px] md:text-sm px-0.5 md:px-2 py-0 md:py-0.5">
                    {count}
                </Badge>
            </CardContent>
        </Card>
    );
}

interface ActionItemsGridProps<TItem extends { id: string }> {
    folders: FolderType[];
    itemsByFolder: Map<string, TItem[]>;
    itemsUncategorized: TItem[];
    onFolderClick: (folder: FolderType) => void;
    selectedIds: Set<string>;
    onItemClick: (itemId: string) => void;
    renderItemCard: (item: TItem) => React.ReactNode;
    itemWrapperClassName?: string;
}

function ActionItemsGrid<TItem extends { id: string }>({
    folders,
    itemsByFolder,
    itemsUncategorized,
    onFolderClick,
    selectedIds,
    onItemClick,
    renderItemCard,
    itemWrapperClassName,
}: ActionItemsGridProps<TItem>) {
    return (
        <div className="grid grid-cols-4 gap-1.5 md:gap-4 pb-2">
            {/* Folders */}
            {folders
                .filter((folder) => itemsByFolder.has(folder.id))
                .map((folder) => {
                    const folderItems = itemsByFolder.get(folder.id) ?? [];
                    return (
                        <FolderCardButton
                            key={folder.id}
                            folder={folder}
                            count={folderItems.length}
                            onClick={() => onFolderClick(folder)}
                        />
                    );
                })}
            {/* Uncategorized items */}
            {itemsUncategorized.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const wrapperClassName = [
                    "cursor-pointer transition-all",
                    itemWrapperClassName ?? "",
                    isSelected ? "ring-2 ring-primary rounded-lg" : "",
                ]
                    .filter(Boolean)
                    .join(" ");
                return (
                    <div key={item.id} onClick={() => onItemClick(item.id)} className={wrapperClassName}>
                        {renderItemCard(item)}
                    </div>
                );
            })}
        </div>
    );
}

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
                            <span className="absolute top-0 left-0 text-xs md:text-sm text-muted-foreground">
                                #{rosterNumber}
                            </span>
                        )}
                        <div className="flex-1">
                            <CredenzaTitle className="text-center text-lg md:text-2xl">
                                {fullName}
                            </CredenzaTitle>
                            <p className="text-center text-xs md:text-sm text-muted-foreground mb-2 md:mb-4">
                                {gender}
                            </p>
                            <div className="flex items-center justify-center gap-1 md:gap-2 mb-2 md:mb-4">
                                <Trophy className="size-5 md:size-8 text-yellow-500" />
                                <span className="text-xl md:text-2xl font-semibold">{totalPoints}</span>
                            </div>
                            <div className="flex items-center justify-center gap-3 md:gap-6 mb-3 md:mb-6">
                                <div className="flex items-center gap-1 md:gap-2">
                                    <Award className="size-4 md:size-6 text-muted-foreground" />
                                    <span className="text-sm md:text-lg">{awardedPoints}</span>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2">
                                    <Flag className="size-4 md:size-6 text-muted-foreground" />
                                    <span className="text-sm md:text-lg">-{removedPoints}</span>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2">
                                    <Gift className="size-4 md:size-6 text-muted-foreground" />
                                    <span className="text-sm md:text-lg">{redeemedPoints}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CredenzaHeader>
                <CredenzaBody>
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className="grid w-full grid-cols-3 h-9 md:h-10">
                            <TabsTrigger value="award" className="text-xs md:text-sm">Award Points</TabsTrigger>
                            <TabsTrigger value="remove" className="text-xs md:text-sm">Remove Points</TabsTrigger>
                            <TabsTrigger value="redeem" className="text-xs md:text-sm">Redeem Points</TabsTrigger>
                        </TabsList>
                        <TabsContent value="award" className="space-y-2 md:space-y-4 mt-2 md:mt-4">
                            <ActionTabControls
                                quantityId="quantity-award"
                                applyModeId="apply-mode-award"
                                quantity={quantity}
                                setQuantity={setQuantity}
                                applyMode={applyMode}
                                setApplyMode={setApplyMode}
                                isSubmitting={isSubmitting}
                                createAction={
                                    canManage ? (
                                        <CreateBehaviorDialog classId={classId}>
                                            <Button variant="outline" size="sm" className="text-xs md:text-sm h-7 md:h-9">
                                                <Plus className="size-3 md:size-4 mr-1 md:mr-2" />
                                                <span>Create</span>
                                            </Button>
                                        </CreateBehaviorDialog>
                                    ) : null
                                }
                            />
                            <ScrollArea className="h-[300px] md:h-[350px] max-h-[calc(100vh-400px)]">
                                <div className="pr-4 pb-8 md:pb-6">
                                    <ActionItemsGrid
                                        folders={folders}
                                        itemsByFolder={positiveBehaviorsByFolder}
                                        itemsUncategorized={positiveBehaviorsUncategorized}
                                        onFolderClick={(folder) => handleFolderClick(folder, "behavior")}
                                        selectedIds={selectedBehaviorIds}
                                        onItemClick={handleBehaviorClick}
                                        renderItemCard={(behavior) => (
                                            <BehaviorCard
                                                behavior={behavior}
                                                classId={classId}
                                                canManage={false}
                                                preferMobile
                                            />
                                        )}
                                    />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="remove" className="space-y-2 md:space-y-4 mt-2 md:mt-4">
                            <ActionTabControls
                                quantityId="quantity-remove"
                                applyModeId="apply-mode-remove"
                                quantity={quantity}
                                setQuantity={setQuantity}
                                applyMode={applyMode}
                                setApplyMode={setApplyMode}
                                isSubmitting={isSubmitting}
                                createAction={
                                    canManage ? (
                                        <CreateBehaviorDialog classId={classId}>
                                            <Button variant="outline" size="sm" className="text-xs md:text-sm h-7 md:h-9">
                                                <Plus className="size-3 md:size-4 mr-1 md:mr-2" />
                                                <span>Create</span>
                                            </Button>
                                        </CreateBehaviorDialog>
                                    ) : null
                                }
                            />
                            <ScrollArea className="h-[300px] md:h-[350px] max-h-[calc(100vh-400px)]">
                                <div className="pr-4 pb-8 md:pb-6">
                                    <ActionItemsGrid
                                        folders={folders}
                                        itemsByFolder={negativeBehaviorsByFolder}
                                        itemsUncategorized={negativeBehaviorsUncategorized}
                                        onFolderClick={(folder) => handleFolderClick(folder, "behavior")}
                                        selectedIds={selectedBehaviorIds}
                                        onItemClick={handleBehaviorClick}
                                        itemWrapperClassName="h-[100px] md:h-[150px]"
                                        renderItemCard={(behavior) => (
                                            <BehaviorCard
                                                behavior={behavior}
                                                classId={classId}
                                                canManage={false}
                                                preferMobile
                                            />
                                        )}
                                    />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="redeem" className="space-y-2 md:space-y-4 mt-2 md:mt-4">
                            <ActionTabControls
                                quantityId="quantity-redeem"
                                applyModeId="apply-mode-redeem"
                                quantity={quantity}
                                setQuantity={setQuantity}
                                applyMode={applyMode}
                                setApplyMode={setApplyMode}
                                isSubmitting={isSubmitting}
                                createAction={
                                    canManage ? (
                                        <CreateRewardItemDialog classId={classId}>
                                            <Button variant="outline" size="sm" className="text-xs md:text-sm h-7 md:h-9">
                                                <Plus className="size-3 md:size-4 mr-1 md:mr-2" />
                                                <span>Create</span>
                                            </Button>
                                        </CreateRewardItemDialog>
                                    ) : null
                                }
                            />
                            <ScrollArea className="h-[300px] md:h-[350px] max-h-[calc(100vh-400px)]">
                                <div className="pr-4 pb-8 md:pb-6">
                                    <ActionItemsGrid
                                        folders={folders}
                                        itemsByFolder={rewardItemsByFolder}
                                        itemsUncategorized={rewardItemsUncategorized}
                                        onFolderClick={(folder) => handleFolderClick(folder, "reward")}
                                        selectedIds={selectedRewardItemIds}
                                        onItemClick={handleRewardItemClick}
                                        itemWrapperClassName="h-[100px] md:h-[150px]"
                                        renderItemCard={(rewardItem) => (
                                            <RewardItemCard
                                                rewardItem={rewardItem}
                                                classId={classId}
                                                canManage={false}
                                                preferMobile
                                            />
                                        )}
                                    />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    {canApply && (
                        <div className="mt-3 md:mt-6 flex justify-end">
                            <Button onClick={handleApply} disabled={isSubmitting} className="text-xs md:text-sm h-8 md:h-10 px-3 md:px-4">
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
