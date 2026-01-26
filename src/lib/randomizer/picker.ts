/** @format */

import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ScopeSelection } from "@/routes/classes/_classesLayout/$classId/random-tools/randomizer/-components/scope-filter-select";

export type StudentPickStats = {
    studentId: string;
    studentName: string;
    positionCounts: Map<number, number>; // position -> count
    totalPicks: number;
};

/**
 * Calculate pick statistics for students based on all rounds for a class
 */
export function calculatePickStats(
    rounds: InstaQLEntity<
        AppSchema,
        "picker_rounds",
        { picks: {} }
    >[]
): StudentPickStats[] {
    const statsMap = new Map<string, StudentPickStats>();

    for (const round of rounds) {
        const picks = round.picks ?? [];
        for (const pick of picks) {
            const stats =
                statsMap.get(pick.studentId) ||
                ({
                    studentId: pick.studentId,
                    studentName: pick.studentName,
                    positionCounts: new Map(),
                    totalPicks: 0,
                } as StudentPickStats);

            const currentCount = stats.positionCounts.get(pick.position) || 0;
            stats.positionCounts.set(pick.position, currentCount + 1);
            stats.totalPicks++;

            statsMap.set(pick.studentId, stats);
        }
    }

    return Array.from(statsMap.values());
}

/**
 * Get or create an active round for the current scope
 */
export async function getOrCreateActiveRound(
    classId: string,
    scope: ScopeSelection
): Promise<
    InstaQLEntity<AppSchema, "picker_rounds", { picks: {} }> | null
> {
    const { picker_rounds } = await db.query({
        picker_rounds: {
            $: {
                where: {
                    "class.id": classId,
                    scopeType: scope.type,
                    scopeId: scope.id,
                    isActive: true,
                },
            },
            picks: {},
        },
    });

    if (picker_rounds.length > 0) {
        return picker_rounds[0];
    }

    // Create new round
    const roundId = id();
    await db.transact([
        db.tx.picker_rounds[roundId]
            .create({
                startedAt: new Date(),
                scopeType: scope.type,
                scopeId: scope.id,
                scopeName: scope.name,
                isActive: true,
            })
            .link({ class: classId }),
    ]);

    // Query the newly created round
    const { picker_rounds: newRounds } = await db.query({
        picker_rounds: {
            $: {
                where: { id: roundId },
            },
            picks: {},
        },
    });

    return newRounds[0] || null;
}

/**
 * Pick a random student from the available (unpicked) students
 */
export function pickRandomStudent(
    availableStudents: InstaQLEntity<AppSchema, "$users">[]
): InstaQLEntity<AppSchema, "$users"> | null {
    if (availableStudents.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * availableStudents.length);
    return availableStudents[randomIndex];
}

/**
 * Save a pick to the database
 */
export async function savePick(
    student: InstaQLEntity<AppSchema, "$users">,
    roundId: string,
    position: number,
    studentName: string
): Promise<void> {
    const pickId = id();
    const pickedAt = new Date();

    await db.transact([
        db.tx.picker_picks[pickId]
            .create({
                pickedAt,
                position,
                studentId: student.id,
                studentName,
            })
            .link({ round: roundId }),
    ]);
}

/**
 * Mark a round as completed
 */
export async function completeRound(roundId: string): Promise<void> {
    await db.transact([
        db.tx.picker_rounds[roundId].update({
            completedAt: new Date(),
            isActive: false,
        }),
    ]);
}

/**
 * Start a new round (mark current as inactive, create new active)
 */
export async function startNewRound(
    classId: string,
    scope: ScopeSelection,
    currentRoundId?: string
): Promise<
    InstaQLEntity<AppSchema, "picker_rounds", { picks: {} }> | null
> {
    const transactions = [];

    // Mark current round as inactive if provided
    if (currentRoundId) {
        transactions.push(
            db.tx.picker_rounds[currentRoundId].update({
                isActive: false,
            })
        );
    }

    // Create new round
    const roundId = id();
    transactions.push(
        db.tx.picker_rounds[roundId]
            .create({
                startedAt: new Date(),
                scopeType: scope.type,
                scopeId: scope.id,
                scopeName: scope.name,
                isActive: true,
            })
            .link({ class: classId })
    );

    await db.transact(transactions);

    // Query the newly created round
    const { picker_rounds: newRounds } = await db.query({
        picker_rounds: {
            $: {
                where: { id: roundId },
            },
            picks: {},
        },
    });

    return newRounds[0] || null;
}
