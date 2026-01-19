/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type RewardItem = InstaQLEntity<AppSchema, "reward_items">;
type Folder = InstaQLEntity<AppSchema, "folders">;
type RewardRedemption = InstaQLEntity<
    AppSchema,
    "reward_redemptions",
    { rewardItem?: { folder?: {} } }
>;

/**
 * Calculate the start date of the current period for recurring purchase limits
 */
export function getPurchaseLimitPeriodStart(
    period: "day" | "week" | "month",
    multiplier: number,
    referenceDate: Date = new Date()
): Date {
    const date = new Date(referenceDate);
    date.setHours(0, 0, 0, 0);

    switch (period) {
        case "day": {
            // Start of current day
            return date;
        }
        case "week": {
            // Start of current week (Sunday = 0)
            const dayOfWeek = date.getDay();
            const daysToSubtract = dayOfWeek;
            date.setDate(date.getDate() - daysToSubtract);
            // For multiplier > 1, find which "week block" we're in
            if (multiplier > 1) {
                const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
                const weekBlock = Math.floor(daysSinceEpoch / (7 * multiplier));
                const blockStartDays = weekBlock * 7 * multiplier;
                date.setTime(blockStartDays * 1000 * 60 * 60 * 24);
            }
            return date;
        }
        case "month": {
            // Start of current month
            date.setDate(1);
            // For multiplier > 1, find which "month block" we're in
            if (multiplier > 1) {
                const monthIndex = date.getMonth();
                const year = date.getFullYear();
                const monthBlock = Math.floor(monthIndex / multiplier);
                date.setMonth(monthBlock * multiplier);
                date.setFullYear(year);
            }
            return date;
        }
    }
}

/**
 * Calculate the end date of the current period for recurring purchase limits
 */
export function getPurchaseLimitPeriodEnd(
    period: "day" | "week" | "month",
    multiplier: number,
    referenceDate: Date = new Date()
): Date {
    const startDate = getPurchaseLimitPeriodStart(period, multiplier, referenceDate);
    const endDate = new Date(startDate);

    switch (period) {
        case "day": {
            endDate.setDate(endDate.getDate() + multiplier);
            endDate.setMilliseconds(endDate.getMilliseconds() - 1);
            return endDate;
        }
        case "week": {
            endDate.setDate(endDate.getDate() + 7 * multiplier);
            endDate.setMilliseconds(endDate.getMilliseconds() - 1);
            return endDate;
        }
        case "month": {
            endDate.setMonth(endDate.getMonth() + multiplier);
            endDate.setMilliseconds(endDate.getMilliseconds() - 1);
            return endDate;
        }
    }
}

/**
 * Calculate the current cycle start and end dates for date range purchase limits
 * Cycles repeat: [startDate, endDate], then next cycle starts at (endDate + 1 day) with same duration
 */
export function getDateRangeCycleDates(
    startDate: Date,
    endDate: Date,
    referenceDate: Date = new Date()
): { cycleStart: Date; cycleEnd: Date } {
    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Calculate the duration of the original range in days
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Find which cycle we're in
    // If reference date is before the first cycle start, use the first cycle
    if (ref < start) {
        return { cycleStart: start, cycleEnd: end };
    }

    // Calculate how many cycles have passed
    const msSinceFirstStart = ref.getTime() - start.getTime();
    const daysSinceFirstStart = Math.floor(msSinceFirstStart / (1000 * 60 * 60 * 24));
    const cycleNumber = Math.floor(daysSinceFirstStart / (durationDays + 1));

    // Calculate the start of the current cycle
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + cycleNumber * (durationDays + 1));

    // Calculate the end of the current cycle
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + durationDays);
    cycleEnd.setHours(23, 59, 59, 999);

    return { cycleStart, cycleEnd };
}

/**
 * Count the total quantity of purchases within a time period
 */
export function countPurchasesInPeriod(
    redemptions: RewardRedemption[],
    periodStart: Date,
    periodEnd: Date,
    itemId?: string,
    folderId?: string
): number {
    let total = 0;

    for (const redemption of redemptions) {
        const redemptionDate = redemption.createdAt
            ? new Date(redemption.createdAt)
            : null;

        if (!redemptionDate) continue;

        // Check if redemption is within the period
        if (redemptionDate >= periodStart && redemptionDate <= periodEnd) {
            // If checking for a specific item
            if (itemId && redemption.rewardItem?.id === itemId) {
                total += redemption.quantity ?? 1;
            }
            // If checking for a folder, verify the item is in that folder
            else if (folderId && redemption.rewardItem?.folder?.id === folderId) {
                total += redemption.quantity ?? 1;
            }
        }
    }

    return total;
}

/**
 * Check if a purchase limit is exceeded for an item
 */
export function checkItemPurchaseLimit(
    item: RewardItem,
    redemptions: RewardRedemption[],
    requestedQuantity: number,
    referenceDate: Date = new Date()
): { allowed: boolean; reason?: string; currentCount?: number; limit?: number } {
    // If limit is not enabled, allow purchase
    if (!item.purchaseLimitEnabled) {
        return { allowed: true };
    }

    const count = item.purchaseLimitCount;
    if (!count || count <= 0) {
        return { allowed: true };
    }

    let periodStart: Date;
    let periodEnd: Date;

    if (item.purchaseLimitType === "recurring") {
        const period = item.purchaseLimitPeriod as "day" | "week" | "month" | undefined;
        const multiplier = item.purchaseLimitPeriodMultiplier ?? 1;

        if (!period) {
            return { allowed: true };
        }

        periodStart = getPurchaseLimitPeriodStart(period, multiplier, referenceDate);
        periodEnd = getPurchaseLimitPeriodEnd(period, multiplier, referenceDate);
    } else if (item.purchaseLimitType === "dateRange") {
        const startDate = item.purchaseLimitStartDate
            ? new Date(item.purchaseLimitStartDate)
            : null;
        const endDate = item.purchaseLimitEndDate
            ? new Date(item.purchaseLimitEndDate)
            : null;

        if (!startDate || !endDate) {
            return { allowed: true };
        }

        const cycleDates = getDateRangeCycleDates(startDate, endDate, referenceDate);
        periodStart = cycleDates.cycleStart;
        periodEnd = cycleDates.cycleEnd;
    } else {
        return { allowed: true };
    }

    const currentCount = countPurchasesInPeriod(
        redemptions,
        periodStart,
        periodEnd,
        item.id
    );

    if (currentCount + requestedQuantity > count) {
        return {
            allowed: false,
            reason: `Purchase limit exceeded. Limit: ${count}, Current: ${currentCount}, Requested: ${requestedQuantity}`,
            currentCount,
            limit: count,
        };
    }

    return { allowed: true, currentCount, limit: count };
}

/**
 * Check if a purchase limit is exceeded for a folder
 */
export function checkFolderPurchaseLimit(
    folder: Folder,
    redemptions: RewardRedemption[],
    requestedQuantity: number,
    referenceDate: Date = new Date()
): { allowed: boolean; reason?: string; currentCount?: number; limit?: number } {
    // If limit is not enabled, allow purchase
    if (!folder.purchaseLimitEnabled) {
        return { allowed: true };
    }

    const count = folder.purchaseLimitCount;
    if (!count || count <= 0) {
        return { allowed: true };
    }

    let periodStart: Date;
    let periodEnd: Date;

    if (folder.purchaseLimitType === "recurring") {
        const period = folder.purchaseLimitPeriod as "day" | "week" | "month" | undefined;
        const multiplier = folder.purchaseLimitPeriodMultiplier ?? 1;

        if (!period) {
            return { allowed: true };
        }

        periodStart = getPurchaseLimitPeriodStart(period, multiplier, referenceDate);
        periodEnd = getPurchaseLimitPeriodEnd(period, multiplier, referenceDate);
    } else if (folder.purchaseLimitType === "dateRange") {
        const startDate = folder.purchaseLimitStartDate
            ? new Date(folder.purchaseLimitStartDate)
            : null;
        const endDate = folder.purchaseLimitEndDate
            ? new Date(folder.purchaseLimitEndDate)
            : null;

        if (!startDate || !endDate) {
            return { allowed: true };
        }

        const cycleDates = getDateRangeCycleDates(startDate, endDate, referenceDate);
        periodStart = cycleDates.cycleStart;
        periodEnd = cycleDates.cycleEnd;
    } else {
        return { allowed: true };
    }

    const currentCount = countPurchasesInPeriod(
        redemptions,
        periodStart,
        periodEnd,
        undefined,
        folder.id
    );

    if (currentCount + requestedQuantity > count) {
        return {
            allowed: false,
            reason: `Folder purchase limit exceeded. Limit: ${count}, Current: ${currentCount}, Requested: ${requestedQuantity}`,
            currentCount,
            limit: count,
        };
    }

    return { allowed: true, currentCount, limit: count };
}

/**
 * Check both item and folder purchase limits
 */
export function checkPurchaseLimits(
    item: RewardItem,
    folder: Folder | null | undefined,
    redemptions: RewardRedemption[],
    requestedQuantity: number,
    referenceDate: Date = new Date()
): { allowed: boolean; reason?: string; type?: "item" | "folder" } {
    // Check item limit first
    const itemCheck = checkItemPurchaseLimit(item, redemptions, requestedQuantity, referenceDate);
    if (!itemCheck.allowed) {
        return { allowed: false, reason: itemCheck.reason, type: "item" };
    }

    // Check folder limit if item is in a folder
    if (folder) {
        const folderCheck = checkFolderPurchaseLimit(
            folder,
            redemptions,
            requestedQuantity,
            referenceDate
        );
        if (!folderCheck.allowed) {
            return { allowed: false, reason: folderCheck.reason, type: "folder" };
        }
    }

    return { allowed: true };
}
