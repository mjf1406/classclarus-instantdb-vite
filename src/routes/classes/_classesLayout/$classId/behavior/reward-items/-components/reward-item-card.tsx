/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Coins } from "lucide-react";
import { EditRewardItemDialog } from "./edit-reward-item-dialog";
import { DeleteRewardItemDialog } from "./delete-reward-item-dialog";
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
    const cost = rewardItem.cost ?? 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                            <Star className="size-5 text-primary" />
                            {rewardItem.name}
                        </CardTitle>
                        {rewardItem.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {rewardItem.description}
                            </p>
                        )}
                    </div>
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
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
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <Coins className="size-4" />
                    <span>{cost} pts</span>
                </div>
            </CardContent>
        </Card>
    );
}
