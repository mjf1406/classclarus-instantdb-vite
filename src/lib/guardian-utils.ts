/** @format */

import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";
import { generateJoinCode } from "@/lib/invite-utils";

type UserQueryResult = {
    $users?: Array<InstaQLEntity<AppSchema, "$users", { guardians: {} }>>;
};

/**
 * Gets transactions to link a student's guardians to a class.
 * Works with both client-side (React) and server-side (Admin) InstantDB instances.
 *
 * @param db - Database instance (client or admin)
 * @param studentId - ID of the student whose guardians should be added
 * @param classId - ID of the class to add guardians to
 * @returns Array of link transactions (empty if student has no guardians)
 */
export async function getGuardianLinkTransactions(
    db: any,
    studentId: string,
    classId: string
): Promise<any[]> {
    if (!studentId || !classId) {
        return [];
    }

    try {
        // Query student with their guardians
        const query = {
            $users: {
                $: {
                    where: {
                        id: studentId,
                    },
                },
                guardians: {},
            },
        };

        // Client DB uses queryOnce, admin DB uses query
        const result = await (db.queryOnce ? db.queryOnce(query) : db.query(query));
        // Admin DB returns result directly, client DB wraps in 'data' property
        const queryResult = (result as any).data ?? result;
        const typedResult = (queryResult as UserQueryResult | undefined) ?? null;
        const student = typedResult?.$users?.[0];

        if (!student || !student.guardians || student.guardians.length === 0) {
            // Student has no guardians - return empty array (not an error)
            return [];
        }

        // Create link transactions for each guardian
        const transactions = student.guardians.map((guardian) => {
            return db.tx.classes[classId].link({
                classGuardians: guardian.id,
            });
        });

        return transactions;
    } catch (error) {
        // If query fails, log error but don't throw - let caller handle
        console.error(
            `[Guardian Utils] Error querying guardians for student ${studentId}:`,
            error
        );
        // Return empty array to allow operation to continue
        // Caller should handle transaction failures
        return [];
    }
}

/**
 * Generates a unique roster guardian code.
 * Uses the same format as class join codes (6 characters).
 *
 * @returns A 6-character uppercase code
 */
export function generateRosterGuardianCode(): string {
    return generateJoinCode();
}

/**
 * Ensures a roster entry exists for student+class with a guardian code.
 * If roster doesn't exist, creates it. If it exists but has no code, generates one.
 * Works with both client-side (React) and server-side (Admin) InstantDB instances.
 *
 * @param db - Database instance (client or admin)
 * @param classId - ID of the class
 * @param studentId - ID of the student
 * @returns The guardian code (existing or newly generated)
 */
export async function ensureRosterHasGuardianCode(
    db: any,
    classId: string,
    studentId: string
): Promise<string> {
    if (!classId || !studentId) {
        throw new Error("Class ID and Student ID are required");
    }

    try {
        // Query for existing roster entry linking student to class
        const rosterQuery = {
            class_roster: {
                $: {
                    where: {
                        and: [
                            { "class.id": classId },
                            { "student.id": studentId },
                        ],
                    },
                },
                class: {},
                student: {},
            },
        };

        // Client DB uses queryOnce, admin DB uses query
        const result = await (db.queryOnce ? db.queryOnce(rosterQuery) : db.query(rosterQuery));
        const queryResult = (result as any).data ?? result;
        const rosterEntries = queryResult?.class_roster || [];
        const existingRoster = rosterEntries[0];

        // If roster exists and has code, return it
        if (existingRoster?.guardianCode) {
            return existingRoster.guardianCode;
        }

        // Generate a new unique code
        let newCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            newCode = generateRosterGuardianCode();
            attempts++;

            // Check if code already exists in any roster entry
            const codeCheckQuery = {
                class_roster: {
                    $: {
                        where: {
                            guardianCode: newCode,
                        },
                    },
                },
            };

            // Client DB uses queryOnce, admin DB uses query
            const codeCheckResult = await (db.queryOnce ? db.queryOnce(codeCheckQuery) : db.query(codeCheckQuery));
            const codeCheckData = (codeCheckResult as any).data ?? codeCheckResult;
            const existingRosterWithCode = codeCheckData?.class_roster?.[0];

            if (!existingRosterWithCode) {
                // Code is unique, break out of loop
                break;
            }

            if (attempts >= maxAttempts) {
                throw new Error(
                    "Failed to generate unique roster guardian code after multiple attempts"
                );
            }
        } while (attempts < maxAttempts);

        // If roster exists but no code, update it
        if (existingRoster) {
            await db.transact(
                db.tx.class_roster[existingRoster.id].update({
                    guardianCode: newCode,
                })
            );
        } else {
            // Roster doesn't exist, create it with the code
            // Determine which SDK we're using based on db interface
            // Client DB has queryOnce, admin DB only has query
            const isClientDb = typeof (db as any).queryOnce === "function";
            const idModule = isClientDb
                ? await import("@instantdb/react")
                : await import("@instantdb/admin");
            const rosterId = idModule.id();
            await db.transact(
                db.tx.class_roster[rosterId]
                    .create({
                        guardianCode: newCode,
                    })
                    .link({ class: classId })
                    .link({ student: studentId })
            );
        }

        return newCode;
    } catch (error) {
        console.error(
            `[Guardian Utils] Error ensuring roster guardian code for student ${studentId} in class ${classId}:`,
            error
        );
        throw error;
    }
}
