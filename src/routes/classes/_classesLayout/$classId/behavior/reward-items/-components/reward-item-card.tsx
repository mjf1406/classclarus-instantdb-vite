/** @format */

import { RewardItemCardMobile } from "./reward-item-card-mobile";
import { RewardItemCardDesktop } from "./reward-item-card-desktop";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface RewardItemCardProps {
    rewardItem: InstaQLEntity<
        AppSchema,
        "reward_items",
        { class?: {} }
    >;
    classId: string;
    canManage: boolean;
}

export function RewardItemCard({
    rewardItem,
    classId,
    canManage,
}: RewardItemCardProps) {
    return (
        <>
            <div className="md:hidden">
                <RewardItemCardMobile
                    rewardItem={rewardItem}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
            <div className="hidden md:block">
                <RewardItemCardDesktop
                    rewardItem={rewardItem}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
        </>
    );
}
