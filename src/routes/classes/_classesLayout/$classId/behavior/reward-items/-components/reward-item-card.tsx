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
    /** When true, always use desktop layout (e.g. in List view on mobile). */
    preferDesktop?: boolean;
    /** When true, always use mobile layout. */
    preferMobile?: boolean;
}

export function RewardItemCard({
    rewardItem,
    classId,
    canManage,
    preferDesktop = false,
    preferMobile = false,
}: RewardItemCardProps) {
    if (preferMobile) {
        return (
            <RewardItemCardMobile
                rewardItem={rewardItem}
                classId={classId}
                canManage={canManage}
            />
        );
    }
    if (preferDesktop) {
        return (
            <RewardItemCardDesktop
                rewardItem={rewardItem}
                classId={classId}
                canManage={canManage}
            />
        );
    }
    return (
        <>
            <div className="lg:hidden">
                <RewardItemCardMobile
                    rewardItem={rewardItem}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
            <div className="hidden lg:block">
                <RewardItemCardDesktop
                    rewardItem={rewardItem}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
        </>
    );
}
