/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type Behavior = InstaQLEntity<
    AppSchema,
    "behaviors",
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

type BehaviorsQueryResult = {
    behaviors: Behavior[];
};

type FoldersQueryResult = {
    folders: Folder[];
};

/**
 * Hook to fetch behaviors and folders for a class
 * @param classId - The ID of the class
 * @returns Object containing behaviors, folders, and isLoading state
 */
export function useClassBehaviors(classId: string | undefined) {
    const hasValidClassId = classId && classId.trim() !== "";

    const behaviorsQuery = hasValidClassId
        ? {
              behaviors: {
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

    const { data, isLoading } = db.useQuery(behaviorsQuery);

    const typedBehaviors = (data as BehaviorsQueryResult | undefined) ?? null;
    const behaviors = typedBehaviors?.behaviors ?? [];

    const typedFolders = (data as FoldersQueryResult | undefined) ?? null;
    const folders = (typedFolders?.folders ?? []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );

    return {
        behaviors,
        folders,
        isLoading: !hasValidClassId || isLoading,
    };
}
