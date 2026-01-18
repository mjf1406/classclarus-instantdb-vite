/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Coins, Folder, Pencil, Trash2 } from "lucide-react";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import { CardActionMenu } from "../../-components/card-action-menu";
import { EditRewardItemDialog } from "./edit-reward-item-dialog";
import { DeleteRewardItemDialog } from "./delete-reward-item-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface RewardItemCardDesktopProps {
    rewardItem: InstaQLEntity<
        AppSchema,
        "reward_items",
        { class?: {}; folder?: {} }
    >;
    classId: string;
    canManage: boolean;
}

export function RewardItemCardDesktop({
    rewardItem,
    classId,
    canManage,
}: RewardItemCardDesktopProps) {
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
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                    <CardTitle className="text-sm lg:text-lg flex items-center gap-3">
                            {iconBlock}
                            {rewardItem.name}
                        </CardTitle>
                        {rewardItem.description && (
                            <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                                {rewardItem.description}
                            </p>
                        )}
                    </div>
                    {canManage && (
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
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <Coins className="size-4" />
                        <span>{cost}</span>
                    </div>
                    {rewardItem.folder && (
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            <Folder className="size-4" />
                            <span>{rewardItem.folder.name ?? "Unnamed"}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
