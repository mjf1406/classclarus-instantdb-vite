/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type ClassWithBehaviorLogs = InstaQLEntity<
    AppSchema,
    "classes",
    {
        behaviorLogs?: { behavior?: {}; student?: {} };
        rewardRedemptions?: { rewardItem?: {}; student?: {} };
    }
>;

type ClassBehaviorLogsQueryResult = {
    classes: ClassWithBehaviorLogs[];
};

/**
 * Hook to fetch all behavior logs and reward redemptions for a class
 * Used for class-level points management
 * @param classId - The ID of the class
 * @returns Object containing behaviorLogs, rewardRedemptions, and isLoading state
 */
export function useClassBehaviorLogs(classId: string | undefined) {
    const hasValidClassId = classId && classId.trim() !== "";

    const classQuery = hasValidClassId
        ? {
              classes: {
                  $: { where: { id: classId } },
                  behaviorLogs: {
                      behavior: {},
                      student: {},
                  },
                  rewardRedemptions: {
                      rewardItem: {},
                      student: {},
                  },
              },
          }
        : null;

    const { data, isLoading } = db.useQuery(classQuery);

    const typedData =
        (data as ClassBehaviorLogsQueryResult | undefined) ?? null;
    const classEntity = typedData?.classes?.[0];

    return {
        behaviorLogs: classEntity?.behaviorLogs ?? [],
        rewardRedemptions: classEntity?.rewardRedemptions ?? [],
        isLoading: !hasValidClassId || isLoading,
    };
}
