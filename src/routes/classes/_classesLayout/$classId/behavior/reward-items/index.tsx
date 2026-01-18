/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Star, Plus } from "lucide-react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateRewardItemDialog } from "./-components/create-reward-item-dialog";
import { RewardItemCard } from "./-components/reward-item-card";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/behavior/reward-items/"
)({
    component: RouteComponent,
});

type RewardItem = InstaQLEntity<
    AppSchema,
    "reward_items",
    { class: {} }
>;

type RewardItemsQueryResult = {
    reward_items: RewardItem[];
};

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const { data: rewardItemsData, isLoading: rewardItemsLoading } =
        db.useQuery(
            classId
                ? {
                      reward_items: {
                          $: { where: { "class.id": classId } },
                          class: {},
                      },
                  }
                : null
        );

    const typedData =
        (rewardItemsData as RewardItemsQueryResult | undefined) ?? null;
    const rewardItems = typedData?.reward_items ?? [];

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    if (!classId) {
        return null;
    }

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Star className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Reward Items
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage reward items for your class
                            </p>
                        </div>
                    </div>
                    {canManage && (
                        <CreateRewardItemDialog classId={classId}>
                            <Button>
                                <Plus className="size-4 mr-2" />
                                Create Reward Item
                            </Button>
                        </CreateRewardItemDialog>
                    )}
                </div>

                {rewardItemsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardContent className="py-6">
                                    <Skeleton className="h-6 w-48 mb-4" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : rewardItems.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Star className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No reward items have been created yet.
                            </p>
                            {canManage && (
                                <CreateRewardItemDialog classId={classId}>
                                    <Button>
                                        <Plus className="size-4 mr-2" />
                                        Create Your First Reward Item
                                    </Button>
                                </CreateRewardItemDialog>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {rewardItems.map((rewardItem) => (
                            <RewardItemCard
                                key={rewardItem.id}
                                rewardItem={rewardItem}
                                classId={classId}
                                canManage={canManage}
                            />
                        ))}
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
