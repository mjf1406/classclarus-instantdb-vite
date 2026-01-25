/** @format */

import { FisherYatesShuffle } from "./random-assigner";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { SelectedItem } from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/-components/groups-teams-pdf-document";

export interface AssignmentResult {
    item: string;
    studentId: string;
    studentNumber: number | null;
    studentName: string;
    groupOrTeamId: string;
    groupOrTeamName: string;
    isTeam: boolean;
    parentGroupName?: string; // Only present when isTeam is true
}

export interface RunAssignerInput {
    assigner: InstaQLEntity<AppSchema, "random_assigners", { class: {} }>;
    selectedItems: SelectedItem[];
    rosterByStudentId: Map<
        string,
        {
            id: string;
            firstName: string | null | undefined;
            lastName: string | null | undefined;
            number: number | null | undefined;
        }
    >;
}

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

function assignItemsToStudents(
    items: string[],
    students: InstaQLEntity<AppSchema, "$users">[],
    groupOrTeamId: string,
    groupOrTeamName: string,
    isTeam: boolean,
    rosterByStudentId: Map<
        string,
        {
            id: string;
            firstName: string | null | undefined;
            lastName: string | null | undefined;
            number: number | null | undefined;
        }
    >,
    parentGroupName?: string
): AssignmentResult[] {
    if (items.length === 0 || students.length === 0) {
        return [];
    }

    // Shuffle items using Fisher-Yates
    const shuffledItems = FisherYatesShuffle([...items]);

    // Truncate to minimum (items or students)
    const minLength = Math.min(shuffledItems.length, students.length);
    const itemsToAssign = shuffledItems.slice(0, minLength);
    const studentsToAssign = students.slice(0, minLength);

    // Pair items with students
    return itemsToAssign.map((item, index) => {
        const student = studentsToAssign[index];
        const rosterEntry = rosterByStudentId.get(student.id);
        const studentName = getStudentDisplayName(student, rosterEntry);
        const studentNumber = rosterEntry?.number ?? null;

        const result: AssignmentResult = {
            item,
            studentId: student.id,
            studentNumber,
            studentName,
            groupOrTeamId,
            groupOrTeamName,
            isTeam,
        };

        // Always include parentGroupName when isTeam is true
        if (isTeam) {
            result.parentGroupName = parentGroupName;
        }

        return result;
    });
}

export function runRandomAssigner(input: RunAssignerInput): AssignmentResult[] {
    const { assigner, selectedItems, rosterByStudentId } = input;

    // Parse items from JSON string
    let items: string[] = [];
    try {
        if (assigner.items && assigner.items.trim()) {
            const parsed = JSON.parse(assigner.items);
            items = Array.isArray(parsed) ? parsed : [];
        }
    } catch (error) {
        console.error("Failed to parse assigner items:", error);
        return [];
    }

    if (items.length === 0) {
        return [];
    }

    const results: AssignmentResult[] = [];

    // Process each selected item
    for (const selectedItem of selectedItems) {
        if (selectedItem.type === "group") {
            // If a group is selected, run over the whole group (ignore teams)
            const group = selectedItem.group;
            const allStudents = group.groupStudents || [];

            // Filter out students who are on teams (if we're running on the group, we want all students)
            // Actually, based on the requirement: "if a group is selected, run over the whole group, ignore teams"
            // This means we should include ALL students in the group, even those on teams
            const groupResults = assignItemsToStudents(
                items,
                allStudents,
                group.id,
                group.name,
                false,
                rosterByStudentId
            );
            results.push(...groupResults);
        } else {
            // If only teams are selected, run separately per team
            const team = selectedItem.team;
            const teamStudents = team.teamStudents || [];
            const parentGroupName = selectedItem.parentGroupName;

            // Validate that parentGroupName exists for teams
            if (!parentGroupName) {
                console.warn(
                    `Missing parentGroupName for team ${team.name} (${team.id}). This may cause issues in PDF generation.`
                );
            }

            const teamResults = assignItemsToStudents(
                items,
                teamStudents,
                team.id,
                team.name,
                true,
                rosterByStudentId,
                parentGroupName
            );
            results.push(...teamResults);
        }
    }

    return results;
}
