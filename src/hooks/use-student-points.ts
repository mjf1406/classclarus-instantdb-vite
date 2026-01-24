/** @format */

import { useMemo } from "react";
import { useStudentBehaviorLogs } from "./use-student-behavior-logs";
import { useStudentRewardRedemptions } from "./use-student-reward-redemptions";

/**
 * Hook to calculate points aggregates for a student
 * Uses behavior logs and reward redemptions hooks to calculate totals
 * @param classId - The ID of the class
 * @param studentId - The ID of the student
 * @returns Object containing points aggregates and isLoading state
 */
export function useStudentPoints(
    classId: string | undefined,
    studentId: string | undefined
) {
    const { behaviorLogs, isLoading: behaviorLogsLoading } =
        useStudentBehaviorLogs(classId, studentId);
    const { rewardRedemptions, isLoading: redemptionsLoading } =
        useStudentRewardRedemptions(classId, studentId);

    const { totalPoints, awardedPoints, removedPoints, redeemedPoints } =
        useMemo(() => {
            let awarded = 0;
            let removed = 0;
            let redeemed = 0;

            for (const log of behaviorLogs) {
                const points = log.behavior?.points ?? 0;
                const qty = (log.quantity ?? 1) as number;
                if (points >= 0) {
                    awarded += points * qty;
                } else {
                    removed += Math.abs(points) * qty;
                }
            }

            for (const redemption of rewardRedemptions) {
                const cost = redemption.rewardItem?.cost ?? 0;
                const qty = (redemption.quantity ?? 1) as number;
                redeemed += cost * qty;
            }

            return {
                totalPoints: awarded - removed - redeemed,
                awardedPoints: awarded,
                removedPoints: removed,
                redeemedPoints: redeemed,
            };
        }, [behaviorLogs, rewardRedemptions]);

    return {
        totalPoints,
        awardedPoints,
        removedPoints,
        redeemedPoints,
        isLoading: behaviorLogsLoading || redemptionsLoading,
    };
}
