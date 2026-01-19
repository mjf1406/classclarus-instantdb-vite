/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Pencil, Trash2, Coins, Clock } from "lucide-react";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import { CardActionMenu } from "../../-components/card-action-menu";
import { EditRewardItemDialog } from "./edit-reward-item-dialog";
import { DeleteRewardItemDialog } from "./delete-reward-item-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface RewardItemCardMobileProps {
    rewardItem: InstaQLEntity<
        AppSchema,
        "reward_items",
        { class?: {} }
    >;
    classId: string;
    canManage: boolean;
}

export function RewardItemCardMobile({
    rewardItem,
    classId,
    canManage,
}: RewardItemCardMobileProps) {
    const cost = rewardItem.cost ?? 0;

    const getPurchaseLimitText = () => {
        if (!rewardItem.purchaseLimitEnabled || !rewardItem.purchaseLimitCount) return null;

        const count = rewardItem.purchaseLimitCount;
        if (rewardItem.purchaseLimitType === "recurring") {
            const period = rewardItem.purchaseLimitPeriod ?? "week";
            const multiplier = rewardItem.purchaseLimitPeriodMultiplier ?? 1;
            const periodText = period === "day" ? "day" : period === "week" ? "week" : "month";
            if (multiplier === 1) {
                return `${count}/${periodText}`;
            } else {
                return `${count}/every ${multiplier} ${periodText}s`;
            }
        } else if (rewardItem.purchaseLimitType === "dateRange") {
            return `${count}/cycle`;
        }
        return null;
    };

    const purchaseLimitText = getPurchaseLimitText();

    const iconBlock = (
        <div className="flex size-10 md:size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {rewardItem.icon ? (
                <FontAwesomeIconFromId
                    id={rewardItem.icon}
                    className="size-5 md:size-7 text-primary"
                    fallback={<Star className="size-5 md:size-7 text-primary" />}
                />
            ) : (
                <Star className="size-5 md:size-7 text-primary" />
            )}
        </div>
    );

    return (
        <Card className="relative h-[100px] md:h-[150px]">
            <CardContent className="p-0 flex flex-col items-center text-center">
                {canManage && (
                    <div className="absolute top-1 right-1 md:top-2 md:right-2 z-10">
                        <CardActionMenu>
                            <EditRewardItemDialog
                                rewardItem={rewardItem}
                                classId={classId}
                                asDropdownItem
                            >
                                <Pencil className="size-4" /> Edit
                            </EditRewardItemDialog>
                            <DeleteRewardItemDialog
                                rewardItem={rewardItem}
                                asDropdownItem
                            >
                                <Trash2 className="size-4" /> Delete
                            </DeleteRewardItemDialog>
                        </CardActionMenu>
                    </div>
                )}
                {iconBlock}
                <span className="mt-0.5 md:mt-2 line-clamp-2 text-[10px] md:text-sm">{rewardItem.name}</span>
                <div className="mt-0 md:mt-1 flex items-center gap-1 text-[10px] md:text-xs text-amber-700 dark:text-amber-400">
                    <Coins className="size-3 md:size-4" />{cost}
                </div>
                {purchaseLimitText && (
                    <Badge variant="outline" className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] px-1 md:px-1.5 py-0 md:py-0.5">
                        <Clock className="size-2.5 md:size-3 mr-0.5" />
                        {purchaseLimitText}
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}
