/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type RewardRedemption = InstaQLEntity<
    AppSchema,
    "reward_redemptions",
    {
        rewardItem?: { folder?: {} };
        student?: {};
        createdBy?: {};
        class?: {};
    }
>;

type RewardRedemptionsQueryResult = {
    reward_redemptions: RewardRedemption[];
};

/**
 * Hook to fetch reward redemptions for a student in a class
 * Supports guardian access - if studentId is a child's ID, guardians can view their data
 * @param classId - The ID of the class
 * @param studentId - The ID of the student (optional, if not provided returns empty array)
 * @returns Object containing rewardRedemptions and isLoading state
 */
export function useStudentRewardRedemptions(
    classId: string | undefined,
    studentId: string | undefined
) {
    const hasValidClassId = classId && classId.trim() !== "";
    const hasValidStudentId = studentId && studentId.trim() !== "";

    const rewardRedemptionsQuery =
        hasValidClassId && hasValidStudentId
            ? {
                  reward_redemptions: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": studentId },
                              ],
                          },
                          order: { createdAt: "desc" } as const,
                      },
                      rewardItem: {
                          folder: {},
                      },
                      student: {},
                      createdBy: {},
                      class: {},
                  },
              }
            : null;

    const { data, isLoading } = db.useQuery(rewardRedemptionsQuery);

    const typedRewardRedemptions =
        (data as RewardRedemptionsQueryResult | undefined) ?? null;
    const rewardRedemptions = typedRewardRedemptions?.reward_redemptions ?? [];

    return {
        rewardRedemptions,
        isLoading: !hasValidClassId || !hasValidStudentId || isLoading,
    };
}
