/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type Folder = InstaQLEntity<
    AppSchema,
    "folders",
    {
        behaviors?: {};
        rewardItems?: {};
        class?: {};
    }
>;

type FoldersQueryResult = {
    folders: Folder[];
};

/**
 * Hook to fetch folders for a class with nested behaviors and reward items
 * @param classId - The ID of the class
 * @returns Object containing folders and isLoading state
 */
export function useClassFolders(classId: string | undefined) {
    const hasValidClassId = classId && classId.trim() !== "";

    const foldersQuery = hasValidClassId
        ? {
              folders: {
                  $: { where: { "class.id": classId } },
                  behaviors: {},
                  rewardItems: {},
                  class: {},
              },
          }
        : null;

    const { data, isLoading } = db.useQuery(foldersQuery);

    const typedFolders = (data as FoldersQueryResult | undefined) ?? null;
    const folders = (typedFolders?.folders ?? []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );

    return {
        folders,
        isLoading: !hasValidClassId || isLoading,
    };
}
