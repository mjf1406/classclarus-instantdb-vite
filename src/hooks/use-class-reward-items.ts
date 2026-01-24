/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type RewardItem = InstaQLEntity<
    AppSchema,
    "reward_items",
    {
        class?: {};
        folder?: {};
    }
>;

type Folder = InstaQLEntity<
    AppSchema,
    "folders",
    {
        behaviors?: {};
        rewardItems?: {};
        class?: {};
    }
>;

type RewardItemsQueryResult = {
    reward_items: RewardItem[];
};

type FoldersQueryResult = {
    folders: Folder[];
};

/**
 * Hook to fetch reward items and folders for a class
 * @param classId - The ID of the class
 * @returns Object containing rewardItems, folders, and isLoading state
 */
export function useClassRewardItems(classId: string | undefined) {
    const hasValidClassId = classId && classId.trim() !== "";

    const rewardItemsQuery = hasValidClassId
        ? {
              reward_items: {
                  $: { where: { "class.id": classId } },
                  class: {},
                  folder: {},
              },
              folders: {
                  $: { where: { "class.id": classId } },
                  behaviors: {},
                  rewardItems: {},
                  class: {},
              },
          }
        : null;

    const { data, isLoading } = db.useQuery(rewardItemsQuery);

    const typedRewardItems = (data as RewardItemsQueryResult | undefined) ?? null;
    const rewardItems = typedRewardItems?.reward_items ?? [];

    const typedFolders = (data as FoldersQueryResult | undefined) ?? null;
    const folders = (typedFolders?.folders ?? []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );

    return {
        rewardItems,
        folders,
        isLoading: !hasValidClassId || isLoading,
    };
}
