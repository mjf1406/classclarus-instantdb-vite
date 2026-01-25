/** @format */

import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { SelectedItem } from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/-components/groups-teams-pdf-document";
import type { AssignmentResult } from "./run-random-assigner";

// =============================================================================
// TYPES
// =============================================================================

type Student = InstaQLEntity<AppSchema, "$users">;
type RotationDirection = "front-to-back" | "back-to-front";

interface RosterEntry {
    id: string;
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    number: number | null | undefined;
    gender: string | null | undefined;
}

interface GenderGroup {
    name: string;
    students: Student[];
}

interface ProcessAndSaveRotatingInput {
    assigner: InstaQLEntity<AppSchema, "rotating_assigners", { class: {}; runs: {} }>;
    selectedItems: SelectedItem[];
    rosterByStudentId: Map<string, RosterEntry>;
    classId: string;
    assignerId: string;
}

interface RunRotatingAssignerInput {
    assigner: InstaQLEntity<AppSchema, "rotating_assigners", { class: {}; runs: {} }>;
    selectedItem: SelectedItem;
    rosterByStudentId: Map<string, RosterEntry>;
    runCountByGroupTeamId: Map<string, number>;
}

interface RunRotatingAssignerOutput {
    results: AssignmentResult[];
    error: Error | null;
}

// =============================================================================
// PURE UTILITY FUNCTIONS
// =============================================================================

function rotate<T>(arr: T[], direction: RotationDirection): T[] {
    if (arr.length === 0) return arr;
    return direction === "back-to-front"
        ? [arr[arr.length - 1], ...arr.slice(0, -1)]
        : [...arr.slice(1), arr[0]];
}

function rotateByN<T>(arr: T[], n: number, direction: RotationDirection): T[] {
    if (arr.length === 0) return arr;
    const rotations = n % arr.length;
    let result = [...arr];
    for (let i = 0; i < rotations; i++) {
        result = rotate(result, direction);
    }
    return result;
}

// =============================================================================
// STUDENT & ROSTER HELPERS
// =============================================================================

function getStudentsFromSelectedItem(selectedItem: SelectedItem): Student[] {
    return selectedItem.type === "group"
        ? selectedItem.group.groupStudents || []
        : selectedItem.team.teamStudents || [];
}

function getStudentDisplayName(
    student: Student,
    rosterEntry?: RosterEntry
): string {
    if (rosterEntry?.firstName || rosterEntry?.lastName) {
        return `${rosterEntry.firstName || ""} ${rosterEntry.lastName || ""}`.trim();
    }
    const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();
    return name || student.email || "Unknown Student";
}

function filterStudentsInRoster(
    students: Student[],
    rosterByStudentId: Map<string, RosterEntry>
): Student[] {
    return students.filter(s => rosterByStudentId.has(s.id));
}

function sortStudentsByNumber(
    students: Student[],
    rosterByStudentId: Map<string, RosterEntry>
): Student[] {
    return [...students].sort((a, b) => {
        const aNumber = rosterByStudentId.get(a.id)?.number ?? 0;
        const bNumber = rosterByStudentId.get(b.id)?.number ?? 0;
        return aNumber - bNumber;
    });
}

// =============================================================================
// GROUP/TEAM HELPERS
// =============================================================================

function getGroupTeamId(selectedItem: SelectedItem): string {
    return selectedItem.type === "group"
        ? selectedItem.group.id
        : selectedItem.team.id;
}

function getGroupTeamName(selectedItem: SelectedItem): string {
    return selectedItem.type === "group"
        ? selectedItem.group.name
        : selectedItem.team.name;
}

function getParentGroupName(selectedItem: SelectedItem): string | undefined {
    return selectedItem.type === "team" ? selectedItem.parentGroupName : undefined;
}

// =============================================================================
// ITEMS PARSING
// =============================================================================

function parseAssignerItems(itemsJson: string | null | undefined): string[] | Error {
    if (!itemsJson || !itemsJson.trim()) {
        return [];
    }
    try {
        const parsed = JSON.parse(itemsJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return new Error("Failed to parse assigner items");
    }
}

// =============================================================================
// ROTATION DIRECTION PARSING
// =============================================================================

function parseRotationDirection(direction: string | null | undefined): RotationDirection {
    return direction === "back-to-front" || direction === "front-to-back"
        ? direction
        : "front-to-back";
}

// =============================================================================
// RUN COUNT TRACKING
// =============================================================================

function buildRunCountByGroupTeamId(
    runs: { results?: string | null }[] | undefined
): Map<string, number> {
    const runCountByGroupTeamId = new Map<string, number>();

    if (!runs || !Array.isArray(runs)) {
        return runCountByGroupTeamId;
    }

    for (const run of runs) {
        const groupTeamIds = extractGroupTeamIdsFromRun(run.results);
        for (const groupTeamId of groupTeamIds) {
            const currentCount = runCountByGroupTeamId.get(groupTeamId) ?? 0;
            runCountByGroupTeamId.set(groupTeamId, currentCount + 1);
        }
    }

    return runCountByGroupTeamId;
}

function extractGroupTeamIdsFromRun(resultsJson: string | null | undefined): Set<string> {
    const groupTeamIds = new Set<string>();
    
    if (!resultsJson) return groupTeamIds;

    try {
        const runResults: AssignmentResult[] = JSON.parse(resultsJson);
        for (const result of runResults) {
            if (result.groupOrTeamId) {
                groupTeamIds.add(result.groupOrTeamId);
            }
        }
    } catch (error) {
        console.error("Failed to parse run results:", error);
    }

    return groupTeamIds;
}

// =============================================================================
// GENDER GROUPING
// =============================================================================

function groupStudentsByGender(
    students: Student[],
    rosterByStudentId: Map<string, RosterEntry>
): GenderGroup[] {
    const groups: Record<string, Student[]> = {
        male: [],
        female: [],
        other: [],
        "prefer-not-to-say": [],
    };

    for (const student of students) {
        const gender = rosterByStudentId.get(student.id)?.gender;
        if (gender && gender in groups) {
            groups[gender].push(student);
        }
    }

    return [
        { name: "male", students: groups.male },
        { name: "female", students: groups.female },
        { name: "other", students: groups.other },
        { name: "prefer-not-to-say", students: groups["prefer-not-to-say"] },
    ];
}

function getNonEmptyGenderGroups(genderGroups: GenderGroup[]): GenderGroup[] {
    return genderGroups.filter(group => group.students.length > 0);
}

// =============================================================================
// ROTATION LOGIC
// =============================================================================

interface RotatedAssignment {
    items: string[];
    students: Student[];
}

function computeRotatedAssignment(
    items: string[],
    students: Student[],
    runCount: number,
    direction: RotationDirection
): RotatedAssignment {
    const count = Math.min(items.length, students.length);
    
    if (count === 0) {
        return { items: [], students: [] };
    }

    // Rotate the larger array, keep smaller fixed
    if (items.length > students.length) {
        return {
            items: rotateByN(items, runCount, direction).slice(0, count),
            students: students.slice(0, count),
        };
    } else {
        return {
            items: items.slice(0, count),
            students: rotateByN(students, runCount, direction).slice(0, count),
        };
    }
}

// =============================================================================
// RESULT CREATION
// =============================================================================

interface ResultContext {
    groupTeamId: string;
    groupOrTeamName: string;
    isTeam: boolean;
    parentGroupName: string | undefined;
}

function createAssignmentResult(
    item: string,
    student: Student,
    rosterEntry: RosterEntry | undefined,
    context: ResultContext
): AssignmentResult {
    return {
        item,
        studentId: student.id,
        studentNumber: rosterEntry?.number ?? null,
        studentName: getStudentDisplayName(student, rosterEntry),
        groupOrTeamId: context.groupTeamId,
        groupOrTeamName: context.groupOrTeamName,
        isTeam: context.isTeam,
        parentGroupName: context.parentGroupName,
    };
}

function createResultsFromAssignment(
    assignment: RotatedAssignment,
    rosterByStudentId: Map<string, RosterEntry>,
    context: ResultContext
): AssignmentResult[] {
    return assignment.items.map((item, index) => {
        const student = assignment.students[index];
        const rosterEntry = rosterByStudentId.get(student.id);
        return createAssignmentResult(item, student, rosterEntry, context);
    });
}

// =============================================================================
// GENDER-BALANCED ROTATION
// =============================================================================

function processGenderBalancedRotation(
    items: string[],
    studentsInRoster: Student[],
    rosterByStudentId: Map<string, RosterEntry>,
    runCount: number,
    direction: RotationDirection,
    context: ResultContext
): AssignmentResult[] {
    const genderGroups = groupStudentsByGender(studentsInRoster, rosterByStudentId);
    const sortedGenderGroups = genderGroups.map(group => ({
        name: group.name,
        students: sortStudentsByNumber(group.students, rosterByStudentId),
    }));
    
    const nonEmptyGroups = getNonEmptyGenderGroups(sortedGenderGroups);
    
    return nonEmptyGroups.flatMap(group => 
        processGenderGroup(group.students, items, runCount, direction, rosterByStudentId, context)
    );
}

function processGenderGroup(
    students: Student[],
    items: string[],
    runCount: number,
    direction: RotationDirection,
    rosterByStudentId: Map<string, RosterEntry>,
    context: ResultContext
): AssignmentResult[] {
    const assignment = computeRotatedAssignment(items, students, runCount, direction);
    return createResultsFromAssignment(assignment, rosterByStudentId, context);
}

// =============================================================================
// NORMAL (NON-GENDER-BALANCED) ROTATION
// =============================================================================

function processNormalRotation(
    items: string[],
    studentsInRoster: Student[],
    rosterByStudentId: Map<string, RosterEntry>,
    runCount: number,
    direction: RotationDirection,
    context: ResultContext
): AssignmentResult[] | Error {
    const sortedStudents = sortStudentsByNumber(studentsInRoster, rosterByStudentId);
    
    if (items.length === 0 || sortedStudents.length === 0) {
        return new Error("No items or students to assign");
    }

    const assignment = computeRotatedAssignment(items, sortedStudents, runCount, direction);
    return createResultsFromAssignment(assignment, rosterByStudentId, context);
}

// =============================================================================
// TRANSACTION BUILDING
// =============================================================================

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

    let rotatingRunTx = db.tx.rotating_assigner_runs[runId]
        .create({
            runDate,
            results: resultsJson,
            totalRuns,
        })
        .link({ rotatingAssigner: assignerId })
        .link({ class: classId });

    if (selectedItem.type === "group") {
        rotatingRunTx = rotatingRunTx.link({ group: selectedItem.group.id });
    } else if (selectedItem.type === "team") {
        rotatingRunTx = rotatingRunTx.link({ team: selectedItem.team.id });
    }

    return rotatingRunTx;
}

// =============================================================================
// MAIN EXPORTED FUNCTIONS
// =============================================================================

export function runRotatingAssigner({
    assigner,
    selectedItem,
    rosterByStudentId,
    runCountByGroupTeamId,
}: RunRotatingAssignerInput): RunRotatingAssignerOutput {
    // Parse items
    const itemsResult = parseAssignerItems(assigner.items);
    if (itemsResult instanceof Error) {
        return { results: [], error: itemsResult };
    }
    const items = itemsResult;

    // Get students filtered by roster
    const students = getStudentsFromSelectedItem(selectedItem);
    const studentsInRoster = filterStudentsInRoster(students, rosterByStudentId);

    // Get rotation parameters
    const groupTeamId = getGroupTeamId(selectedItem);
    const runCount = runCountByGroupTeamId.get(groupTeamId) ?? 0;
    const direction = parseRotationDirection(assigner.direction);

    // Build result context
    const context: ResultContext = {
        groupTeamId,
        groupOrTeamName: getGroupTeamName(selectedItem),
        isTeam: selectedItem.type === "team",
        parentGroupName: getParentGroupName(selectedItem),
    };

    // Process based on gender balancing setting
    if (assigner.balanceGender) {
        const results = processGenderBalancedRotation(
            items,
            studentsInRoster,
            rosterByStudentId,
            runCount,
            direction,
            context
        );
        return { results, error: null };
    }

    const resultsOrError = processNormalRotation(
        items,
        studentsInRoster,
        rosterByStudentId,
        runCount,
        direction,
        context
    );

    if (resultsOrError instanceof Error) {
        return { results: [], error: resultsOrError };
    }

    return { results: resultsOrError, error: null };
}

export async function processAndSaveRotatingAssigner(
    input: ProcessAndSaveRotatingInput
): Promise<AssignmentResult[]> {
    const { assigner, selectedItems, rosterByStudentId, classId, assignerId } = input;

    const runCountByGroupTeamId = buildRunCountByGroupTeamId(assigner.runs);
    const runDate = new Date();

    const { allResults, runTransactions } = processSelectedItems(
        selectedItems,
        assigner,
        rosterByStudentId,
        runCountByGroupTeamId,
        assignerId,
        classId,
        runDate
    );

    if (runTransactions.length > 0) {
        db.transact(runTransactions);
    }

    return allResults;
}

function processSelectedItems(
    selectedItems: SelectedItem[],
    assigner: InstaQLEntity<AppSchema, "rotating_assigners", { class: {}; runs: {} }>,
    rosterByStudentId: Map<string, RosterEntry>,
    runCountByGroupTeamId: Map<string, number>,
    assignerId: string,
    classId: string,
    runDate: Date
): { allResults: AssignmentResult[]; runTransactions: NonNullable<ReturnType<typeof buildRotatingAssignerRunTransaction>>[] } {
    const allResults: AssignmentResult[] = [];
    const runTransactions: NonNullable<ReturnType<typeof buildRotatingAssignerRunTransaction>>[] = [];

    for (const selectedItem of selectedItems) {
        const assignerResult = runRotatingAssigner({
            assigner,
            selectedItem,
            rosterByStudentId,
            runCountByGroupTeamId,
        });

        if (assignerResult.error) {
            throw assignerResult.error;
        }

        const itemResults = assignerResult.results;
        allResults.push(...itemResults);

        const groupTeamId = getGroupTeamId(selectedItem);
        const currentRunCount = runCountByGroupTeamId.get(groupTeamId) ?? 0;
        const totalRuns = currentRunCount + 1;

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

    return { allResults, runTransactions };
}
