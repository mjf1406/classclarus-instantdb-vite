/** @format */

import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { SelectedItem } from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/-components/groups-teams-pdf-document";
import type { AssignmentResult } from "./run-random-assigner";

function rotate<T>(
    arr: T[],
    direction: "front-to-back" | "back-to-front",
): T[] {
    // front-to-back rotation moves the first element to the back (left rotate).
    // Example: [1, 2, 3, 4] -> [2, 3, 4, 1]
    // back-to-front rotation moves the last element to the front (right rotate).
    // Example: [1, 2, 3, 4] -> [4, 1, 2, 3]
    if (arr.length === 0) return arr;
    return direction === "back-to-front"
        ? [arr[arr.length - 1], ...arr.slice(0, -1)]
        : [...arr.slice(1), arr[0]];
}

// Rotate array by N positions using direction
function rotateByN<T>(
    arr: T[],
    n: number,
    direction: "front-to-back" | "back-to-front"
): T[] {
    if (arr.length === 0) return arr;
    const rotations = n % arr.length;
    let result = [...arr];
    for (let i = 0; i < rotations; i++) {
        result = rotate(result, direction);
    }
    return result;
}

// Helper function to get students from SelectedItem
function getStudentsFromSelectedItem(
    selectedItem: SelectedItem
): InstaQLEntity<AppSchema, "$users">[] {
    if (selectedItem.type === "group") {
        return selectedItem.group.groupStudents || [];
    } else {
        return selectedItem.team.teamStudents || [];
    }
}

// Helper function for student display name
function getStudentDisplayName(
    student: InstaQLEntity<AppSchema, "$users">,
    rosterEntry?: {
        firstName: string | null | undefined;
        lastName: string | null | undefined;
    }
): string {
    // Prefer roster name if available, otherwise use user name
    if (rosterEntry?.firstName || rosterEntry?.lastName) {
        return `${rosterEntry.firstName || ""} ${rosterEntry.lastName || ""}`.trim();
    }
    const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();
    return name || student.email || "Unknown Student";
}

interface ProcessAndSaveRotatingInput {
    assigner: InstaQLEntity<AppSchema, "rotating_assigners", { class: {}; runs: {} }>;
    selectedItems: SelectedItem[];
    rosterByStudentId: Map<
        string,
        {
            id: string;
            firstName: string | null | undefined;
            lastName: string | null | undefined;
            number: number | null | undefined;
            gender: string | null | undefined;
        }
    >;
    classId: string;
    assignerId: string;
}

// Internal function to build transaction for a single rotating assigner run
function buildRotatingAssignerRunTransaction(
    itemResults: AssignmentResult[],
    selectedItem: SelectedItem,
    assignerId: string,
    classId: string,
    runDate: Date,
    totalRuns: number
) {
    if (itemResults.length === 0) {
        return null;
    }

    const runId = id();
    const resultsJson = JSON.stringify(itemResults);

    // Build the transaction with group/team links
    let rotatingRunTx = db.tx.rotating_assigner_runs[runId]
        .create({
            runDate,
            results: resultsJson,
            totalRuns,
        })
        .link({ rotatingAssigner: assignerId })
        .link({ class: classId });

    // Link to group or team based on selectedItem
    if (selectedItem.type === "group") {
        rotatingRunTx = rotatingRunTx.link({ group: selectedItem.group.id });
    } else if (selectedItem.type === "team") {
        rotatingRunTx = rotatingRunTx.link({ team: selectedItem.team.id });
    }

    return rotatingRunTx;
}

// Main exported function that processes and saves
export async function processAndSaveRotatingAssigner(
    input: ProcessAndSaveRotatingInput
): Promise<AssignmentResult[]> {
    const { assigner, selectedItems, rosterByStudentId, classId, assignerId } = input;

    // Build run count per group/team by parsing previous run results
    // This ensures rotation is tracked per group/team, not globally
    const runCountByGroupTeamId = new Map<string, number>();

    if (assigner.runs && Array.isArray(assigner.runs)) {
        for (const run of assigner.runs) {
            // Parse results from this run to find which groups/teams were included
            try {
                const runResults: AssignmentResult[] = run.results
                    ? JSON.parse(run.results)
                    : [];

                // Get unique group/team IDs from this run's results
                const groupTeamIdsInRun = new Set<string>();
                for (const result of runResults) {
                    if (result.groupOrTeamId) {
                        groupTeamIdsInRun.add(result.groupOrTeamId);
                    }
                }

                // Increment count for each group/team that was in this run
                for (const groupTeamId of groupTeamIdsInRun) {
                    const currentCount = runCountByGroupTeamId.get(groupTeamId) ?? 0;
                    runCountByGroupTeamId.set(groupTeamId, currentCount + 1);
                }
            } catch (error) {
                console.error("Failed to parse run results:", error);
            }
        }
    }

    // Process and save: loop through each selected item
    const allResults: AssignmentResult[] = [];
    const runDate = new Date();
    const runTransactions = [];

    for (const selectedItem of selectedItems) {
        // Process: run the assigner for this item
        const assignerResult = runRotatingAssigner({
            assigner,
            selectedItem,
            rosterByStudentId,
            runCountByGroupTeamId,
        });

        // Check for error and throw if present
        if (assignerResult.error) {
            throw assignerResult.error;
        }

        const itemResults = assignerResult.results;
        allResults.push(...itemResults);

        // Calculate totalRuns for this group/team (current run count + 1 for this new run)
        const groupTeamId = selectedItem.type === "group"
            ? selectedItem.group.id
            : selectedItem.team.id;
        const currentRunCount = runCountByGroupTeamId.get(groupTeamId) ?? 0;
        const totalRuns = currentRunCount + 1;

        // Build transaction for this run
        const runTx = buildRotatingAssignerRunTransaction(
            itemResults,
            selectedItem,
            assignerId,
            classId,
            runDate,
            totalRuns
        );
        if (runTx) {
            runTransactions.push(runTx);
        }
    }

    // Save: batch all transactions together
    if (runTransactions.length > 0) {
        db.transact(runTransactions);
    }

    return allResults;
}

interface RunRotatingAssignerInput {
    assigner: InstaQLEntity<AppSchema, "rotating_assigners", { class: {}; runs: {} }>;
    selectedItem: SelectedItem;
    rosterByStudentId: Map<
        string,
        {
            id: string;
            firstName: string | null | undefined;
            lastName: string | null | undefined;
            number: number | null | undefined;
            gender: string | null | undefined;
        }
    >;
    runCountByGroupTeamId: Map<string, number>;
}

interface RunRotatingAssignerOutput {
    results: AssignmentResult[];
    error: Error | null;
}

export function runRotatingAssigner({
    assigner,
    selectedItem,
    rosterByStudentId,
    runCountByGroupTeamId,
}: RunRotatingAssignerInput): RunRotatingAssignerOutput {
    // Gender Balance parsing
    const balanceGender = assigner.balanceGender;

    // Selected Group/Team parsing
    const selectedGroupOrTeam = selectedItem.type === "group" ? selectedItem.group : selectedItem.team;
    if (!selectedGroupOrTeam) {
        return { results: [], error: new Error("No group or team selected") } as RunRotatingAssignerOutput;
    }

    // 1. Parse items from assigner JSON
    let items: string[] = [];
    try {
        if (assigner.items && assigner.items.trim()) {
            const parsed = JSON.parse(assigner.items);
            items = Array.isArray(parsed) ? parsed : [];
        }
    } catch (error) {
        console.error("Failed to parse assigner items:", error);
        return { results: [], error: new Error("Failed to parse assigner items") } as RunRotatingAssignerOutput;
    }

    // 2. Get students from selected group/team, sorted by number
    const students = getStudentsFromSelectedItem(selectedItem);
    // Filter to only students that exist in the roster (for this class)
    const studentsInRoster = students.filter(s => rosterByStudentId.has(s.id));
    
    // 4. Get rotation offset from run count
    const groupTeamId = selectedItem.type === "group"
        ? selectedItem.group.id
        : selectedItem.team.id;
    const runCount = runCountByGroupTeamId.get(groupTeamId) ?? 0;
    const direction: "front-to-back" | "back-to-front" = 
        (assigner.direction === "back-to-front" || assigner.direction === "front-to-back")
            ? assigner.direction
            : "front-to-back";

    // 5. Handle gender balancing vs normal rotation
    const groupOrTeamName = selectedItem.type === "group"
        ? selectedItem.group.name
        : selectedItem.team.name;

    let results: AssignmentResult[] = [];

    if (balanceGender) {
        // Gender balancing: process each gender group separately
        // Group students by gender
        const boys: InstaQLEntity<AppSchema, "$users">[] = [];
        const girls: InstaQLEntity<AppSchema, "$users">[] = [];
        const others: InstaQLEntity<AppSchema, "$users">[] = [];
        const preferNotToSay: InstaQLEntity<AppSchema, "$users">[] = [];
        
        for (const student of studentsInRoster) {
            const rosterEntry = rosterByStudentId.get(student.id);
            const gender = rosterEntry?.gender;
            if (gender === "male") boys.push(student);
            else if (gender === "female") girls.push(student);
            else if (gender === "other") others.push(student);
            else if (gender === "prefer-not-to-say") preferNotToSay.push(student);
        }
        
        // Sort each gender group by number
        const sortByNumber = (a: InstaQLEntity<AppSchema, "$users">, b: InstaQLEntity<AppSchema, "$users">) => {
            const aNumber = rosterByStudentId.get(a.id)?.number ?? 0;
            const bNumber = rosterByStudentId.get(b.id)?.number ?? 0;
            return aNumber - bNumber;
        };
        boys.sort(sortByNumber);
        girls.sort(sortByNumber);
        others.sort(sortByNumber);
        preferNotToSay.sort(sortByNumber);
        
        console.log("Boys: ", boys);
        console.log("Girls: ", girls);
        console.log("Others: ", others);
        console.log("Prefer Not To Say: ", preferNotToSay);

        // Check if at least 2 genders have the same count and that count is > 0
        const genderGroups = [
            { name: "male", students: boys },
            { name: "female", students: girls },
            { name: "other", students: others },
            { name: "prefer-not-to-say", students: preferNotToSay },
        ];
        
        // Count occurrences of each count value
        const countMap = new Map<number, string[]>();
        for (const group of genderGroups) {
            const count = group.students.length;
            if (count > 0) {
                if (!countMap.has(count)) {
                    countMap.set(count, []);
                }
                countMap.get(count)!.push(group.name);
            }
        }
        
        // Find if any count has at least 2 genders
        let matchingCount = 0;
        let matchingGenders: string[] = [];
        for (const [count, genders] of countMap.entries()) {
            if (genders.length >= 2) {
                matchingCount = count;
                matchingGenders = genders;
                break;
            }
        }
        
        if (matchingCount === 0) {
            return { 
                results: [], 
                error: new Error(`Gender balance not maintained: need at least 2 genders with the same count (male: ${boys.length}, female: ${girls.length}, other: ${others.length}, prefer-not-to-say: ${preferNotToSay.length}). You must ensure at least 2 genders have equal counts within selected group/team or uncheck "Balance gender".`) 
            } as RunRotatingAssignerOutput;
        }
        
        // Process each matching gender group separately
        for (const genderName of matchingGenders) {
            const genderStudents = genderName === "male" ? boys
                : genderName === "female" ? girls
                : genderName === "other" ? others
                : preferNotToSay;
            
            // For gender balancing, each student can only be assigned once
            const numItems = items.length;
            const numStudents = genderStudents.length;
            const count = Math.min(numItems, numStudents);
            
            if (count === 0) continue;
            
            let genderItemsToAssign: string[];
            let genderStudentsToAssign: InstaQLEntity<AppSchema, "$users">[];
            
            if (numItems > numStudents) {
                // More items than students: rotate ITEMS, students fixed, assign min(items, students)
                genderItemsToAssign = rotateByN(items, runCount, direction).slice(0, count);
                genderStudentsToAssign = genderStudents.slice(0, count);
            } else {
                // More students than items (or equal): rotate STUDENTS, items fixed
                genderItemsToAssign = items.slice(0, count);
                genderStudentsToAssign = rotateByN(genderStudents, runCount, direction).slice(0, count);
            }
            
            // Generate assignments for this gender group (each student assigned at most once)
            for (let i = 0; i < count; i++) {
                const student = genderStudentsToAssign[i];
                const rosterEntry = rosterByStudentId.get(student.id);
                results.push({
                    item: genderItemsToAssign[i],
                    studentId: student.id,
                    studentNumber: rosterEntry?.number ?? null,
                    studentName: getStudentDisplayName(student, rosterEntry),
                    groupOrTeamId: groupTeamId,
                    groupOrTeamName,
                    isTeam: selectedItem.type === "team",
                    parentGroupName: selectedItem.type === "team"
                        ? selectedItem.parentGroupName
                        : undefined,
                });
            }
        }
        
        // Add remaining students from genders that don't match (if any) - run them normally
        for (const group of genderGroups) {
            if (!matchingGenders.includes(group.name) && group.students.length > 0) {
                const numItems = items.length;
                const numStudents = group.students.length;
                const count = Math.min(numItems, numStudents);
                
                if (count === 0) continue;
                
                let nonMatchingItemsToAssign: string[];
                let nonMatchingStudentsToAssign: typeof group.students;
                
                if (numItems > numStudents) {
                    nonMatchingItemsToAssign = rotateByN(items, runCount, direction).slice(0, count);
                    nonMatchingStudentsToAssign = group.students.slice(0, count);
                } else {
                    nonMatchingItemsToAssign = items.slice(0, count);
                    nonMatchingStudentsToAssign = rotateByN(group.students, runCount, direction).slice(0, count);
                }
                
                for (let i = 0; i < count; i++) {
                    const student = nonMatchingStudentsToAssign[i];
                    const rosterEntry = rosterByStudentId.get(student.id);
                    results.push({
                        item: nonMatchingItemsToAssign[i],
                        studentId: student.id,
                        studentNumber: rosterEntry?.number ?? null,
                        studentName: getStudentDisplayName(student, rosterEntry),
                        groupOrTeamId: groupTeamId,
                        groupOrTeamName,
                        isTeam: selectedItem.type === "team",
                        parentGroupName: selectedItem.type === "team"
                            ? selectedItem.parentGroupName
                            : undefined,
                    });
                }
            }
        }
    } else {
        // No gender balancing: normal rotation logic
        const sortedStudents = [...studentsInRoster].sort((a, b) => {
            const aNumber = rosterByStudentId.get(a.id)?.number ?? 0;
            const bNumber = rosterByStudentId.get(b.id)?.number ?? 0;
            return aNumber - bNumber;
        });

        // Determine count and check for empty arrays
        const count = Math.min(items.length, sortedStudents.length);
        if (count === 0) {
            return { results: [], error: new Error("No items or students to assign") } as RunRotatingAssignerOutput;
        }

        // Simple rule: ROTATE THE LARGER ARRAY, keep smaller fixed
        let itemsToAssign: string[];
        let studentsToAssign: typeof sortedStudents;

        if (items.length > sortedStudents.length) {
            // More items than students: rotate ITEMS, students fixed
            itemsToAssign = rotateByN(items, runCount, direction).slice(0, count);
            studentsToAssign = sortedStudents.slice(0, count);
        } else {
            // More students than items (or equal): rotate STUDENTS, items fixed
            itemsToAssign = items.slice(0, count);
            studentsToAssign = rotateByN(sortedStudents, runCount, direction).slice(0, count);
        }

        // Create results
        results = itemsToAssign.map((item, index) => {
            const student = studentsToAssign[index];
            const rosterEntry = rosterByStudentId.get(student.id);
            return {
                item,
                studentId: student.id,
                studentNumber: rosterEntry?.number ?? null,
                studentName: getStudentDisplayName(student, rosterEntry),
                groupOrTeamId: groupTeamId,
                groupOrTeamName,
                isTeam: selectedItem.type === "team",
                parentGroupName: selectedItem.type === "team"
                    ? selectedItem.parentGroupName
                    : undefined,
            };
        });
    }

    return { results, error: null } as RunRotatingAssignerOutput;
}