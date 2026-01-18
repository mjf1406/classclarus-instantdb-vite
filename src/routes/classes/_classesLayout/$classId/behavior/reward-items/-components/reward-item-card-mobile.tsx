/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, MoreVertical } from "lucide-react";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
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

    const iconBlock = (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {rewardItem.icon ? (
                <FontAwesomeIconFromId
                    id={rewardItem.icon}
                    className="size-7 text-primary"
                    fallback={<Star className="size-7 text-primary" />}
                />
            ) : (
                <Star className="size-7 text-primary" />
            )}
        </div>
    );

    return (
        <Card className="relative">
            <CardContent className="flex flex-col items-center pt-6 pb-4 text-center">
                {canManage && (
                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="size-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <EditRewardItemDialog
                                    rewardItem={rewardItem}
                                    classId={classId}
                                    asDropdownItem
                                >
                                    Edit
                                </EditRewardItemDialog>
                                <DeleteRewardItemDialog
                                    rewardItem={rewardItem}
                                    asDropdownItem
                                >
                                    Delete
                                </DeleteRewardItemDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                {iconBlock}
                <span className="mt-2 line-clamp-2 text-sm">{rewardItem.name}</span>
                <span className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    {cost}
                </span>
            </CardContent>
        </Card>
    );
}
