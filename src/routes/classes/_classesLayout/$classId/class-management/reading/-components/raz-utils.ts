/** @format */

/**
 * RAZ (Reading A-Z) assessment schedule utilities
 * Based on standard RAZ assessment frequency guidelines
 */

export type ReadingCategory =
    | "Beginning Readers"
    | "Developing Readers"
    | "Effective Readers"
    | "Automatic Readers"
    | "No Previous Record";

export type UrgencyStatus = "overdue" | "due-now" | "coming-soon" | "up-to-date";

export interface ScheduleInfo {
    category: ReadingCategory;
    lowerBoundDays: number;
    upperBoundDays: number;
    scheduleText: string;
}

export interface StudentAssessmentStatus {
    status: UrgencyStatus;
    daysSinceTest: number | null;
    scheduleInfo: ScheduleInfo;
    overdueBy: number;
    reasons: string[];
    detailedExplanation: string;
}

/**
 * Get the assessment schedule info based on reading level
 */
export function getScheduleInfo(level?: string): ScheduleInfo {
    if (!level) {
        return {
            category: "No Previous Record",
            lowerBoundDays: 0,
            upperBoundDays: 0,
            scheduleText:
                "No test record found. An initial assessment is recommended immediately.",
        };
    }

    const firstLetter = level.charAt(0).toUpperCase();

    if (["A", "B", "C"].includes(firstLetter)) {
        return {
            category: "Beginning Readers",
            lowerBoundDays: 14, // 2 weeks
            upperBoundDays: 28, // 4 weeks
            scheduleText: "Tests should be administered every 2 to 4 weeks.",
        };
    } else if (["D", "E", "F", "G", "H", "I", "J"].includes(firstLetter)) {
        return {
            category: "Developing Readers",
            lowerBoundDays: 28, // 4 weeks
            upperBoundDays: 42, // 6 weeks
            scheduleText: "Tests should be administered every 4 to 6 weeks.",
        };
    } else if (["K", "L", "M", "N", "O", "P"].includes(firstLetter)) {
        return {
            category: "Effective Readers",
            lowerBoundDays: 42, // 6 weeks
            upperBoundDays: 56, // 8 weeks
            scheduleText: "Tests should be administered every 6 to 8 weeks.",
        };
    } else if (
        ["Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"].includes(firstLetter)
    ) {
        return {
            category: "Automatic Readers",
            lowerBoundDays: 56, // 8 weeks
            upperBoundDays: 70, // 10 weeks
            scheduleText: "Tests should be administered every 8 to 10 weeks.",
        };
    }

    return {
        category: "No Previous Record",
        lowerBoundDays: 0,
        upperBoundDays: 0,
        scheduleText: "Schedule information is not available.",
    };
}

/**
 * Calculate days since a given date
 */
export function calculateDaysSince(date: Date | string): number {
    const testDate = date instanceof Date ? date : new Date(date);
    const currentDate = new Date();
    const msInDay = 1000 * 60 * 60 * 24;
    return Math.floor((currentDate.getTime() - testDate.getTime()) / msInDay);
}

/**
 * Determine the urgency status of a student's assessment
 */
export function getAssessmentStatus(
    lastAssessmentDate: Date | null,
    lastResult: string | null,
    level: string | null
): StudentAssessmentStatus {
    const scheduleInfo = getScheduleInfo(level ?? undefined);
    const daysSinceTest = lastAssessmentDate
        ? calculateDaysSince(lastAssessmentDate)
        : null;

    const reasons: string[] = [];
    let status: UrgencyStatus;
    let overdueBy = 0;

    // No previous record - needs initial assessment
    if (!lastAssessmentDate || !level) {
        return {
            status: "overdue",
            daysSinceTest: null,
            scheduleInfo,
            overdueBy: 9999,
            reasons: ["No previous assessment record found"],
            detailedExplanation:
                "This student has no RAZ assessment on record. An initial assessment should be conducted to establish their current reading level.",
        };
    }

    const daysOverLower = daysSinceTest! - scheduleInfo.lowerBoundDays;
    const daysOverUpper = daysSinceTest! - scheduleInfo.upperBoundDays;
    const daysUntilDue = scheduleInfo.lowerBoundDays - daysSinceTest!;

    // Check for level down result - always overdue
    if (lastResult === "level down") {
        reasons.push("Previous assessment resulted in a level down");
        status = "overdue";
        overdueBy = Math.max(daysOverLower, 1);
    }
    // Overdue: past upper bound
    else if (daysSinceTest! > scheduleInfo.upperBoundDays) {
        reasons.push(
            `${daysSinceTest} days have passed, exceeding the recommended ${scheduleInfo.upperBoundDays}-day maximum`
        );
        status = "overdue";
        overdueBy = daysOverUpper;
    }
    // Due now: at or past lower bound
    else if (daysSinceTest! >= scheduleInfo.lowerBoundDays) {
        reasons.push(
            `${daysSinceTest} days have passed, meeting the ${scheduleInfo.lowerBoundDays}-day minimum for assessment`
        );
        status = "due-now";
        overdueBy = daysOverLower;
    }
    // Coming soon: within 7 days of lower bound
    else if (daysUntilDue <= 7) {
        reasons.push(
            `Assessment will be due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`
        );
        status = "coming-soon";
        overdueBy = -daysUntilDue;
    }
    // Up to date
    else {
        reasons.push(
            `Last assessment was ${daysSinceTest} days ago, within the recommended schedule`
        );
        status = "up-to-date";
        overdueBy = -daysUntilDue;
    }

    // Build detailed explanation
    const levelInfo = level
        ? `Current Level: ${level} (${scheduleInfo.category})`
        : "No level recorded";
    const scheduleDesc = `Recommended assessment frequency: ${scheduleInfo.lowerBoundDays}–${scheduleInfo.upperBoundDays} days`;
    const lastTestDesc = `Last assessment: ${daysSinceTest} day${daysSinceTest === 1 ? "" : "s"} ago`;
    const reasonsDesc = reasons.join(". ");

    const detailedExplanation = `${levelInfo}\n${scheduleDesc}\n${lastTestDesc}\n\nStatus: ${reasonsDesc}.`;

    return {
        status,
        daysSinceTest,
        scheduleInfo,
        overdueBy,
        reasons,
        detailedExplanation,
    };
}

/**
 * Get the display color class for a status
 */
export function getStatusColor(status: UrgencyStatus): string {
    switch (status) {
        case "overdue":
            return "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800";
        case "due-now":
            return "bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800";
        case "coming-soon":
            return "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800";
        case "up-to-date":
            return "bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800";
    }
}

/**
 * Get badge variant for status
 */
export function getStatusBadgeVariant(
    status: UrgencyStatus
): "destructive" | "default" | "secondary" | "outline" {
    switch (status) {
        case "overdue":
            return "destructive";
        case "due-now":
            return "default";
        case "coming-soon":
            return "secondary";
        case "up-to-date":
            return "outline";
    }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: UrgencyStatus): string {
    switch (status) {
        case "overdue":
            return "Overdue";
        case "due-now":
            return "Due Now";
        case "coming-soon":
            return "Coming Soon";
        case "up-to-date":
            return "Up to Date";
    }
}

/**
 * RAZ levels in order (A-Z only, for backward compatibility)
 */
export const RAZ_LEVELS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
] as const;

export type RazLevel = (typeof RAZ_LEVELS)[number];

/**
 * Extended RAZ levels including "aa", "Z1", "Z2"
 * Full sequence: ["aa", "A", "B", ..., "Z", "Z1", "Z2"]
 */
export const RAZ_LEVELS_EXTENDED: string[] = [
    "aa",
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(i + 65)), // A-Z
    "Z1",
    "Z2",
];

export const RESULT_OPTIONS = ["level up", "stay", "level down"] as const;
export type ResultOption = (typeof RESULT_OPTIONS)[number];

/**
 * Get score-based recommendation for RAZ assessment
 * Based on RAZ Plus guidelines: accuracy + quiz score determine result
 */
export function getScoreRecommendation(
    accuracy: number,
    quizScore: number, // Raw score 0-5 (NOT percentage)
    currentLevel: string | null
): { result: ResultOption; level: string; message: string } {
    const quizPercentage = (quizScore / 5) * 100;
    let recResult: ResultOption = "stay";

    // Determine result based on accuracy and quiz percentage
    if (accuracy >= 95) {
        if (Math.round(quizPercentage) === 100) {
            recResult = "level up";
        } else if (quizPercentage >= 80) {
            recResult = "stay";
        } else {
            recResult = "level down";
        }
    } else if (accuracy >= 90) {
        if (quizPercentage >= 80) {
            recResult = "stay";
        } else {
            recResult = "level down";
        }
    } else {
        recResult = "level down";
    }

    // Determine recommended level based on result
    let recLevel = currentLevel ?? "";
    // Normalize level: "aa" stays lowercase, others uppercase
    const normalizedLevel =
        currentLevel?.toLowerCase() === "aa"
            ? "aa"
            : currentLevel?.toUpperCase() ?? "";

    if (normalizedLevel && RAZ_LEVELS_EXTENDED.includes(normalizedLevel)) {
        const idx = RAZ_LEVELS_EXTENDED.indexOf(normalizedLevel);
        if (recResult === "level up" && idx < RAZ_LEVELS_EXTENDED.length - 1) {
            recLevel = RAZ_LEVELS_EXTENDED[idx + 1] ?? normalizedLevel;
        } else if (recResult === "level down" && idx > 0) {
            recLevel = RAZ_LEVELS_EXTENDED[idx - 1] ?? normalizedLevel;
        } else {
            recLevel = normalizedLevel;
        }
    } else if (normalizedLevel) {
        // If level not in extended list, keep the normalized version
        recLevel = normalizedLevel;
    }

    // Build action message (matching original format with HTML)
    const actionText =
        recResult === "level up"
            ? "Advance Student a Level"
            : recResult === "stay"
              ? "Instruct at this Level"
              : "Lower a Level, Assess Again";

    const message = `With an accuracy of ${accuracy}% and a quiz score of ${Math.round(quizPercentage)}%, RAZ recommends <b>${actionText}</b>.`;

    return {
        result: recResult,
        level: recLevel,
        message,
    };
}

/**
 * Check if a student needs RTI (Response to Intervention) review
 * RTI is needed if student has 2+ consecutive assessments without a "level up"
 */
export function checkRtiStatus(assessments: Array<{ result: string; date: Date | string }>): {
    needsRti: boolean;
    consecutiveNonLevelUp: number;
} {
    if (assessments.length === 0) {
        return { needsRti: false, consecutiveNonLevelUp: 0 };
    }

    // Sort by date (most recent first)
    const sorted = [...assessments].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    });

    // Count consecutive assessments without "level up" from most recent
    let consecutiveNonLevelUp = 0;
    for (const assessment of sorted) {
        if (assessment.result === "level up") {
            break;
        }
        consecutiveNonLevelUp++;
    }

    return {
        needsRti: consecutiveNonLevelUp >= 2,
        consecutiveNonLevelUp,
    };
}
