/** @format */

import { useState } from "react";
import { Folder } from "lucide-react";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BehaviorCard } from "../../behaviors/-components/behavior-card";
import { RewardItemCard } from "../../reward-items/-components/reward-item-card";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Behavior = InstaQLEntity<AppSchema, "behaviors", { class?: {}; folder?: {} }>;
type RewardItem = InstaQLEntity<AppSchema, "reward_items", { class?: {}; folder?: {} }>;
type Folder = InstaQLEntity<AppSchema, "folders", { class?: {} }>;

interface FolderItemsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folder: Folder;
    items: Behavior[] | RewardItem[];
    itemType: "behavior" | "reward";
    classId: string;
    quantity: string;
    applyMode: boolean;
    selectedBehaviorIds: Set<string>;
    selectedRewardItemIds: Set<string>;
    onSelectionChange: (
        behaviorIds: Set<string>,
        rewardItemIds: Set<string>
    ) => void;
    onApply: (behaviorIds?: string[], rewardItemIds?: string[]) => Promise<void>;
    onCloseParent?: () => void;
}

export function FolderItemsDialog({
    open,
    onOpenChange,
    folder,
    items,
    itemType,
    classId,
    quantity,
    applyMode,
    selectedBehaviorIds,
    selectedRewardItemIds,
    onSelectionChange,
    onApply,
    onCloseParent,
}: FolderItemsDialogProps) {
    const { user } = useAuthContext();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sort items alphabetically
    const sortedItems = [...items].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "")
    );

    const handleItemClick = async (itemId: string) => {
        if (applyMode) {
            if (itemType === "behavior") {
                const newSet = new Set(selectedBehaviorIds);
                if (newSet.has(itemId)) {
                    newSet.delete(itemId);
                } else {
                    newSet.add(itemId);
                }
                onSelectionChange(newSet, selectedRewardItemIds);
            } else {
                const newSet = new Set(selectedRewardItemIds);
                if (newSet.has(itemId)) {
                    newSet.delete(itemId);
                } else {
                    newSet.add(itemId);
                }
                onSelectionChange(selectedBehaviorIds, newSet);
            }
        } else {
            // Apply immediately and close both dialogs
            if (itemType === "behavior") {
                await onApply([itemId], []);
            } else {
                await onApply([], [itemId]);
            }
            onOpenChange(false);
            onCloseParent?.();
        }
    };

    const handleApply = async () => {
        setIsSubmitting(true);
        try {
            await onApply();
            onOpenChange(false);
            onCloseParent?.();
        } finally {
            setIsSubmitting(false);
        }
    };

    const canApply =
        applyMode &&
        user?.id &&
        (selectedBehaviorIds.size > 0 || selectedRewardItemIds.size > 0) &&
        !Number.isNaN(Number(quantity)) &&
        Number(quantity) >= 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {folder.icon ? (
                            <FontAwesomeIconFromId
                                id={folder.icon}
                                className="size-5 text-primary"
                                fallback={<Folder className="size-5 text-primary" />}
                            />
                        ) : (
                            <Folder className="size-5 text-primary" />
                        )}
                        {folder.name}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[calc(90vh-200px)] max-h-[500px]">
                    <div className="grid grid-cols-4 gap-4 min-h-[400px]">
                        {sortedItems.map((item) => {
                        const itemId = item.id;
                        const isSelected =
                            itemType === "behavior"
                                ? selectedBehaviorIds.has(itemId)
                                : selectedRewardItemIds.has(itemId);

                        return (
                            <div
                                key={itemId}
                                onClick={() => handleItemClick(itemId)}
                                className={`cursor-pointer transition-all ${
                                    isSelected ? "ring-2 ring-primary rounded-lg" : ""
                                }`}
                            >
                                {itemType === "behavior" ? (
                                    <BehaviorCard
                                        behavior={item as Behavior}
                                        classId={classId}
                                        canManage={false}
                                        preferMobile
                                    />
                                ) : (
                                    <RewardItemCard
                                        rewardItem={item as RewardItem}
                                        classId={classId}
                                        canManage={false}
                                        preferMobile
                                    />
                                )}
                            </div>
                        );
                    })}
                    </div>
                </ScrollArea>
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
            </DialogContent>
        </Dialog>
    );
}
