/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { SelectedItem } from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/-components/groups-teams-pdf-document";
import type { AssignmentResult } from "./run-random-assigner";

export interface RunRotatingAssignerInput {
    assigner: InstaQLEntity<AppSchema, "rotating_assigners", { class: {} }>;
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
    /**
     * Map of groupOrTeamId -> number of previous runs that included this group/team.
     * This allows rotation to be tracked per group/team, so running Team A
     * doesn't affect Team B's rotation position.
     */
    runCountByGroupTeamId: Map<string, number>;
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

/**
 * Determines if a gender string represents a boy/male
 */
function isBoy(gender: string | null | undefined): boolean {
    if (!gender) return false;
    const g = gender.toLowerCase();
    return g === "m" || g === "male" || g === "boy";
}

/**
 * Determines if a gender string represents a girl/female
 */
function isGirl(gender: string | null | undefined): boolean {
    if (!gender) return false;
    const g = gender.toLowerCase();
    return g === "f" || g === "female" || g === "girl";
}

function assignItemsToStudentsWithRotation(
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
            gender: string | null | undefined;
        }
    >,
    direction: "front-to-back" | "back-to-front",
    balanceGender: boolean,
    rotationOffset: number,
    parentGroupName?: string
): AssignmentResult[] {
    if (items.length === 0 || students.length === 0) {
        return [];
    }

    const results: AssignmentResult[] = [];

    if (balanceGender) {
        // Split students by gender
        const boys: InstaQLEntity<AppSchema, "$users">[] = [];
        const girls: InstaQLEntity<AppSchema, "$users">[] = [];
        const others: InstaQLEntity<AppSchema, "$users">[] = [];

        for (const student of students) {
            const rosterEntry = rosterByStudentId.get(student.id);
            const gender = rosterEntry?.gender ?? student.gender;
            if (isBoy(gender)) {
                boys.push(student);
            } else if (isGirl(gender)) {
                girls.push(student);
            } else {
                others.push(student);
            }
        }

        // Use sliding rotation for each gender group
        // Only assign min(group.length, items.length) students per group
        const numBoysToAssign = Math.min(boys.length, items.length);
        const numGirlsToAssign = Math.min(girls.length, items.length);
        const numOthersToAssign = Math.min(others.length, items.length);

        // Assign boys with sliding rotation
        for (let i = 0; i < numBoysToAssign; i++) {
            // Calculate which boy to assign using sliding rotation
            const boyIndex = (i + rotationOffset) % boys.length;
            const boy = boys[boyIndex];
            
            // Calculate which item to assign based on direction
            let itemIndex: number;
            if (direction === "back-to-front") {
                itemIndex = items.length - 1 - i;
            } else {
                itemIndex = i;
            }
            
            const item = items[itemIndex];
            const boyRosterEntry = rosterByStudentId.get(boy.id);
            const boyName = getStudentDisplayName(boy, boyRosterEntry);
            const boyNumber = boyRosterEntry?.number ?? null;

            results.push({
                item,
                studentId: boy.id,
                studentNumber: boyNumber,
                studentName: boyName,
                groupOrTeamId,
                groupOrTeamName,
                isTeam,
                ...(isTeam && parentGroupName ? { parentGroupName } : {}),
            });
        }

        // Assign girls with sliding rotation
        for (let i = 0; i < numGirlsToAssign; i++) {
            // Calculate which girl to assign using sliding rotation
            const girlIndex = (i + rotationOffset) % girls.length;
            const girl = girls[girlIndex];
            
            // Calculate which item to assign based on direction
            let itemIndex: number;
            if (direction === "back-to-front") {
                itemIndex = items.length - 1 - i;
            } else {
                itemIndex = i;
            }
            
            const item = items[itemIndex];
            const girlRosterEntry = rosterByStudentId.get(girl.id);
            const girlName = getStudentDisplayName(girl, girlRosterEntry);
            const girlNumber = girlRosterEntry?.number ?? null;

            results.push({
                item,
                studentId: girl.id,
                studentNumber: girlNumber,
                studentName: girlName,
                groupOrTeamId,
                groupOrTeamName,
                isTeam,
                ...(isTeam && parentGroupName ? { parentGroupName } : {}),
            });
        }

        // Assign others with sliding rotation
        for (let i = 0; i < numOthersToAssign; i++) {
            // Calculate which student to assign using sliding rotation
            const studentIndex = (i + rotationOffset) % others.length;
            const student = others[studentIndex];
            
            // Calculate which item to assign based on direction
            let itemIndex: number;
            if (direction === "back-to-front") {
                itemIndex = items.length - 1 - i;
            } else {
                itemIndex = i;
            }
            
            const item = items[itemIndex];
            const rosterEntry = rosterByStudentId.get(student.id);
            const studentName = getStudentDisplayName(student, rosterEntry);
            const studentNumber = rosterEntry?.number ?? null;

            results.push({
                item,
                studentId: student.id,
                studentNumber,
                studentName,
                groupOrTeamId,
                groupOrTeamName,
                isTeam,
                ...(isTeam && parentGroupName ? { parentGroupName } : {}),
            });
        }
    } else {
        // Standard rotation assignment (no gender balance)
        // Use sliding rotation: only assign min(students.length, items.length) students
        // rotationOffset determines which student starts (slides forward each run)
        const numToAssign = Math.min(students.length, items.length);

        for (let i = 0; i < numToAssign; i++) {
            // Calculate which student to assign using sliding rotation
            const studentIndex = (i + rotationOffset) % students.length;
            const student = students[studentIndex];
            
            // Calculate which item to assign based on direction
            let itemIndex: number;
            if (direction === "back-to-front") {
                // Back-to-front: assign items in reverse order (last item first)
                itemIndex = items.length - 1 - i;
            } else {
                // Front-to-back: assign items in normal order (first item first)
                itemIndex = i;
            }
            
            const item = items[itemIndex];
            const rosterEntry = rosterByStudentId.get(student.id);
            const studentName = getStudentDisplayName(student, rosterEntry);
            const studentNumber = rosterEntry?.number ?? null;

            results.push({
                item,
                studentId: student.id,
                studentNumber,
                studentName,
                groupOrTeamId,
                groupOrTeamName,
                isTeam,
                ...(isTeam && parentGroupName ? { parentGroupName } : {}),
            });
        }
    }

    return results;
}

export interface RunRotatingAssignerOutput {
    results: AssignmentResult[];
    newRotation: number;
}

export function runRotatingAssigner(
    input: RunRotatingAssignerInput
): RunRotatingAssignerOutput {
    const { assigner, selectedItems, rosterByStudentId, runCountByGroupTeamId } = input;

    // Parse items from JSON string
    let items: string[] = [];
    try {
        if (assigner.items && assigner.items.trim()) {
            const parsed = JSON.parse(assigner.items);
            items = Array.isArray(parsed) ? parsed : [];
        }
    } catch (error) {
        console.error("Failed to parse assigner items:", error);
        return { results: [], newRotation: assigner.currentRotation ?? 0 };
    }

    if (items.length === 0) {
        return { results: [], newRotation: assigner.currentRotation ?? 0 };
    }

    // Get direction with backward compatibility (default to "front-to-back")
    // Map old "left"/"right" values to new values
    let direction: "front-to-back" | "back-to-front" = "front-to-back";
    if (assigner.direction === "back-to-front" || assigner.direction === "left") {
        direction = "back-to-front";
    } else if (assigner.direction === "front-to-back" || assigner.direction === "right") {
        direction = "front-to-back";
    }

    const results: AssignmentResult[] = [];
    const balanceGender = assigner.balanceGender ?? false;

    // Process each selected item
    for (const selectedItem of selectedItems) {
        if (selectedItem.type === "group") {
            // If a group is selected, run over the whole group (ignore teams)
            const group = selectedItem.group;
            const allStudents = group.groupStudents || [];

            // Get rotation offset for THIS specific group
            const groupRunCount = runCountByGroupTeamId.get(group.id) ?? 0;
            const rotationOffset = groupRunCount % items.length;

            const groupResults = assignItemsToStudentsWithRotation(
                items,
                allStudents,
                group.id,
                group.name,
                false,
                rosterByStudentId,
                direction,
                balanceGender,
                rotationOffset
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

            // Get rotation offset for THIS specific team
            const teamRunCount = runCountByGroupTeamId.get(team.id) ?? 0;
            const rotationOffset = teamRunCount % items.length;

            const teamResults = assignItemsToStudentsWithRotation(
                items,
                teamStudents,
                team.id,
                team.name,
                true,
                rosterByStudentId,
                direction,
                balanceGender,
                rotationOffset,
                parentGroupName
            );
            results.push(...teamResults);
        }
    }

    // Calculate newRotation: increment the current rotation, or use max run count
    // Since rotation is now per group/team, we'll just increment the global counter
    // This maintains backward compatibility while the actual rotation logic is per group/team
    const currentRotation = assigner.currentRotation ?? 0;
    const newRotation = (currentRotation + 1) % items.length;

    return { results, newRotation };
}
