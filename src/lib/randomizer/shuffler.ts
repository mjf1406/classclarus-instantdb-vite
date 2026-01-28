/** @format */

import { FisherYatesShuffle } from "../assigners/random-assigner";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ScopeSelection } from "@/routes/classes/_classesLayout/$classId/random-tools/randomizer/-components/scope-filter-select";

export type StudentShuffleStats = {
    studentId: string;
    studentName: string;
    firstCount: number; // Times been first
    lastCount: number; // Times been last
    totalShuffles: number; // Total appearances
};

export type ShuffleResult = {
    studentId: string;
    studentName: string;
    position: number;
};

/**
 * Calculate shuffle statistics for students based on all runs for a scope
 */
export function calculateShuffleStats(
    runs: InstaQLEntity<
        AppSchema,
        "shuffler_runs",
        {}
    >[],
    scopeType: string,
    scopeId: string,
    studentMap: Map<string, { id: string; name: string }>
): StudentShuffleStats[] {
    const scopedRuns = runs.filter(
        (r) => r.scopeType === scopeType && r.scopeId === scopeId
    );
    const statsMap = new Map<string, StudentShuffleStats>();

    for (const run of scopedRuns) {
        // Increment first count
        const firstStats =
            statsMap.get(run.firstStudentId) ||
            ({
                studentId: run.firstStudentId,
                studentName:
                    studentMap.get(run.firstStudentId)?.name ?? "Unknown",
                firstCount: 0,
                lastCount: 0,
                totalShuffles: 0,
            } as StudentShuffleStats);
        firstStats.firstCount++;
        statsMap.set(run.firstStudentId, firstStats);

        // Increment last count
        const lastStats =
            statsMap.get(run.lastStudentId) ||
            ({
                studentId: run.lastStudentId,
                studentName:
                    studentMap.get(run.lastStudentId)?.name ?? "Unknown",
                firstCount: 0,
                lastCount: 0,
                totalShuffles: 0,
            } as StudentShuffleStats);
        lastStats.lastCount++;
        statsMap.set(run.lastStudentId, lastStats);

        // Increment total for all participants
        try {
            const results: ShuffleResult[] = JSON.parse(run.results);
            for (const result of results) {
                const stats =
                    statsMap.get(result.studentId) ||
                    ({
                        studentId: result.studentId,
                        studentName:
                            studentMap.get(result.studentId)?.name ??
                            result.studentName,
                        firstCount: 0,
                        lastCount: 0,
                        totalShuffles: 0,
                    } as StudentShuffleStats);
                stats.totalShuffles++;
                statsMap.set(result.studentId, stats);
            }
        } catch (e) {
            console.error("Failed to parse shuffle results:", e);
        }
    }

    return Array.from(statsMap.values());
}

/**
 * Shuffle students with constraints: students with minimum first/last counts are prioritized
 */
export function shuffleWithConstraints(
    students: InstaQLEntity<AppSchema, "$users">[],
    stats: StudentShuffleStats[]
): InstaQLEntity<AppSchema, "$users">[] {
    if (students.length === 0) {
        return [];
    }

    if (students.length === 1) {
        return students;
    }

    const statsMap = new Map(stats.map((s) => [s.studentId, s]));

    // Get minimum counts (default to 0 if no stats)
    const firstCounts = students.map(
        (s) => statsMap.get(s.id)?.firstCount ?? 0
    );
    const lastCounts = students.map(
        (s) => statsMap.get(s.id)?.lastCount ?? 0
    );

    const minFirstCount = Math.min(...firstCounts);
    const minLastCount = Math.min(...lastCounts);

    // Eligible for first: students with minimum first count
    const firstEligible = students.filter(
        (s) => (statsMap.get(s.id)?.firstCount ?? 0) === minFirstCount
    );

    // Eligible for last: students with minimum last count
    const lastEligible = students.filter(
        (s) => (statsMap.get(s.id)?.lastCount ?? 0) === minLastCount
    );

    // Pick first randomly from eligible
    const first =
        firstEligible[Math.floor(Math.random() * firstEligible.length)];

    // Pick last randomly from eligible (excluding first if possible)
    const lastPool = lastEligible.filter((s) => s.id !== first.id);
    const last =
        lastPool.length > 0
            ? lastPool[Math.floor(Math.random() * lastPool.length)]
            : lastEligible[Math.floor(Math.random() * lastEligible.length)];

    // Shuffle remaining students in the middle
    const middle = students.filter(
        (s) => s.id !== first.id && s.id !== last.id
    );
    const shuffledMiddle = FisherYatesShuffle(middle);

    return [first, ...shuffledMiddle, last];
}

/**
 * Save a shuffle run to the database
 */
export async function saveShuffleRun(
    results: ShuffleResult[],
    scope: ScopeSelection,
    classId: string,
    name?: string
): Promise<void> {
    const runId = id();
    const runDate = new Date();

    const firstStudent = results[0];
    const lastStudent = results[results.length - 1];

    if (!firstStudent || !lastStudent) {
        throw new Error("Shuffle results must have at least one student");
    }

    const resultsJson = JSON.stringify(results);

    await db.transact([
        db.tx.shuffler_runs[runId]
            .create({
                name: name || undefined,
                runDate,
                scopeType: scope.type,
                scopeId: scope.id,
                scopeName: scope.name,
                results: resultsJson,
                firstStudentId: firstStudent.studentId,
                lastStudentId: lastStudent.studentId,
            })
            .link({ class: classId }),
    ]);
}

/**
 * Toggle student completion status for a shuffle run
 */
export async function toggleStudentCompletion(
    runId: string,
    studentId: string,
    currentCompletedIds: string[]
): Promise<void> {
    const isCompleted = currentCompletedIds.includes(studentId);
    const updatedIds = isCompleted
        ? currentCompletedIds.filter((id) => id !== studentId)
        : [...currentCompletedIds, studentId];

    await db.transact([
        db.tx.shuffler_runs[runId].update({
            completedStudentIds: JSON.stringify(updatedIds),
        }),
    ]);
}
