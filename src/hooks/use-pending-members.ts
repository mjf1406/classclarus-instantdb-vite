/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

export type PendingMember = InstaQLEntity<
    AppSchema,
    "pendingMembers",
    {
        class: {};
    }
>;

/**
 * Hook to fetch pending members for a class, optionally filtered by role
 * @param classId - The ID of the class to fetch pending members for
 * @param role - Optional role filter ("student" | "teacher" | "guardian")
 * @returns Object containing pendingMembers array and loading state
 */
export function usePendingMembers(
    classId: string | undefined,
    role?: "student" | "teacher" | "guardian"
) {
    const hasValidClassId = classId && classId.trim() !== "";

    const query = hasValidClassId
        ? {
              pendingMembers: {
                  $: {
                      where: {
                          'class.id': classId,
                          ...(role ? { role } : {}),
                      },
                  },
                  class: {},
              },
          }
        : null;

    const { data } = db.useQuery(query);

    type PendingMembersQueryResult = {
        pendingMembers: PendingMember[];
    };

    const typedData =
        (data as PendingMembersQueryResult | undefined) ?? null;
    const pendingMembers = typedData?.pendingMembers || [];

    return {
        pendingMembers,
        isLoading: !hasValidClassId,
    };
}
