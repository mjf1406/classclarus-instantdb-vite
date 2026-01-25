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

interface ProcessAndSaveEquitableInput {
    assigner: InstaQLEntity<AppSchema, "equitable_assigners", { class: {}; runs: {} }>;
    selectedItems: SelectedItem[];
    rosterByStudentId: Map<string, RosterEntry>;
    classId: string;
    assignerId: string;
}

interface RunEquitableAssignerInput {
    assigner: InstaQLEntity<AppSchema, "equitable_assigners", { class: {}; runs: {} }>;
    selectedItem: SelectedItem;
    rosterByStudentId: Map<string, RosterEntry>;
    runCountByGroupTeamId: Map<string, number>;
}

interface RunEquitableAssignerOutput {
    results: AssignmentResult[];
    error: Error | null;
}

// =============================================================================
// PURE UTILITY FUNCTIONS
// =============================================================================

// TODO: Add equitable assignment utility functions here

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
// EQUITABLE ASSIGNMENT LOGIC
// =============================================================================

interface EquitableAssignment {
    items: string[];
    students: Student[];
}

// TODO: Implement equitable assignment algorithm
// This should distribute items to students in a way that balances
// the number of assignments each student receives over time
function computeEquitableAssignment(
    items: string[],
    students: Student[],
    _runCount: number // TODO: Use this to track historical assignments for equitable distribution
): EquitableAssignment {
    // TODO: Implement equitable assignment logic
    // Should consider:
    // - Historical assignment counts per student
    // - Balancing assignments across all students
    // - Handling cases where items.length != students.length
    // - Use runCount to determine rotation/balancing strategy
    const count = Math.min(items.length, students.length);
    
    if (count === 0) {
        return { items: [], students: [] };
    }

    // Placeholder: return first N items and students
    // TODO: Replace with actual equitable assignment algorithm
    return {
        items: items.slice(0, count),
        students: students.slice(0, count),
    };
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
    assignment: EquitableAssignment,
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
// GENDER-BALANCED EQUITABLE ASSIGNMENT
// =============================================================================

function processGenderBalancedEquitable(
    items: string[],
    studentsInRoster: Student[],
    rosterByStudentId: Map<string, RosterEntry>,
    runCount: number,
    context: ResultContext
): AssignmentResult[] {
    // TODO: Implement gender-balanced equitable assignment
    // Should:
    // - Group students by gender
    // - Apply equitable assignment within each gender group
    // - Combine results from all gender groups
    const genderGroups = groupStudentsByGender(studentsInRoster, rosterByStudentId);
    const sortedGenderGroups = genderGroups.map(group => ({
        name: group.name,
        students: sortStudentsByNumber(group.students, rosterByStudentId),
    }));
    
    const nonEmptyGroups = getNonEmptyGenderGroups(sortedGenderGroups);
    
    // TODO: Implement equitable assignment per gender group
    return nonEmptyGroups.flatMap(group => {
        const assignment = computeEquitableAssignment(items, group.students, runCount);
        return createResultsFromAssignment(assignment, rosterByStudentId, context);
    });
}

// =============================================================================
// NORMAL (NON-GENDER-BALANCED) EQUITABLE ASSIGNMENT
// =============================================================================

function processNormalEquitable(
    items: string[],
    studentsInRoster: Student[],
    rosterByStudentId: Map<string, RosterEntry>,
    runCount: number,
    context: ResultContext
): AssignmentResult[] | Error {
    // TODO: Implement normal equitable assignment
    // Should:
    // - Sort students by number
    // - Apply equitable assignment algorithm
    // - Return results or error
    const sortedStudents = sortStudentsByNumber(studentsInRoster, rosterByStudentId);
    
    if (items.length === 0 || sortedStudents.length === 0) {
        return new Error("No items or students to assign");
    }

    const assignment = computeEquitableAssignment(items, sortedStudents, runCount);
    return createResultsFromAssignment(assignment, rosterByStudentId, context);
}

// =============================================================================
// TRANSACTION BUILDING
// =============================================================================

function buildEquitableAssignerRunTransaction(
    itemResults: AssignmentResult[],
    _selectedItem: SelectedItem, // Used in results JSON, not needed for transaction links
    assignerId: string,
    classId: string,
    runDate: Date
) {
    if (itemResults.length === 0) {
        return null;
    }

    const runId = id();
    const resultsJson = JSON.stringify(itemResults);

    const equitableRunTx = db.tx.equitable_assigner_runs[runId]
        .create({
            runDate,
            results: resultsJson,
        })
        .link({ equitableAssigner: assignerId })
        .link({ class: classId });

    // Note: equitable_assigner_runs doesn't have direct links to groups/teams
    // The group/team information is stored in the results JSON

    return equitableRunTx;
}

// =============================================================================
// MAIN EXPORTED FUNCTIONS
// =============================================================================

export function runEquitableAssigner({
    assigner,
    selectedItem,
    rosterByStudentId,
    runCountByGroupTeamId,
}: RunEquitableAssignerInput): RunEquitableAssignerOutput {
    // Parse items
    const itemsResult = parseAssignerItems(assigner.items);
    if (itemsResult instanceof Error) {
        return { results: [], error: itemsResult };
    }
    const items = itemsResult;

    // Get students filtered by roster
    const students = getStudentsFromSelectedItem(selectedItem);
    const studentsInRoster = filterStudentsInRoster(students, rosterByStudentId);

    // Get run count for this group/team
    const groupTeamId = getGroupTeamId(selectedItem);
    const runCount = runCountByGroupTeamId.get(groupTeamId) ?? 0;

    // Build result context
    const context: ResultContext = {
        groupTeamId,
        groupOrTeamName: getGroupTeamName(selectedItem),
        isTeam: selectedItem.type === "team",
        parentGroupName: getParentGroupName(selectedItem),
    };

    // Process based on gender balancing setting
    if (assigner.balanceGender) {
        const results = processGenderBalancedEquitable(
            items,
            studentsInRoster,
            rosterByStudentId,
            runCount,
            context
        );
        return { results, error: null };
    }

    const resultsOrError = processNormalEquitable(
        items,
        studentsInRoster,
        rosterByStudentId,
        runCount,
        context
    );

    if (resultsOrError instanceof Error) {
        return { results: [], error: resultsOrError };
    }

    return { results: resultsOrError, error: null };
}

export async function processAndSaveEquitableAssigner(
    input: ProcessAndSaveEquitableInput
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
    assigner: InstaQLEntity<AppSchema, "equitable_assigners", { class: {}; runs: {} }>,
    rosterByStudentId: Map<string, RosterEntry>,
    runCountByGroupTeamId: Map<string, number>,
    assignerId: string,
    classId: string,
    runDate: Date
): { allResults: AssignmentResult[]; runTransactions: NonNullable<ReturnType<typeof buildEquitableAssignerRunTransaction>>[] } {
    const allResults: AssignmentResult[] = [];
    const runTransactions: NonNullable<ReturnType<typeof buildEquitableAssignerRunTransaction>>[] = [];

    for (const selectedItem of selectedItems) {
        const assignerResult = runEquitableAssigner({
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

        const runTx = buildEquitableAssignerRunTransaction(
            itemResults,
            selectedItem,
            assignerId,
            classId,
            runDate
        );

        if (runTx) {
            runTransactions.push(runTx);
        }
    }

    return { allResults, runTransactions };
}
