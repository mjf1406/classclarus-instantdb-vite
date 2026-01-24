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
 * Generates a unique student guardian code.
 * Uses the same format as class join codes (6 characters).
 *
 * @returns A 6-character uppercase code
 */
export function generateStudentGuardianCode(): string {
    return generateJoinCode();
}

/**
 * Ensures a student has a guardian code. If they don't have one, generates and assigns it.
 * Works with both client-side (React) and server-side (Admin) InstantDB instances.
 *
 * @param db - Database instance (client or admin)
 * @param studentId - ID of the student who needs a guardian code
 * @returns The student's guardian code (existing or newly generated)
 */
export async function ensureStudentHasGuardianCode(
    db: any,
    studentId: string
): Promise<string> {
    if (!studentId) {
        throw new Error("Student ID is required");
    }

    try {
        // Query student to check if they have a code
        const query = {
            $users: {
                $: {
                    where: {
                        id: studentId,
                    },
                },
            },
        };

        // Client DB uses queryOnce, admin DB uses query
        const result = await (db.queryOnce ? db.queryOnce(query) : db.query(query));
        const queryResult = (result as any).data ?? result;
        const student = queryResult?.$users?.[0];

        if (!student) {
            throw new Error(`Student with ID ${studentId} not found`);
        }

        // If student already has a code, return it
        if (student.studentGuardianCode) {
            return student.studentGuardianCode;
        }

        // Generate a new code
        let newCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        // Try to generate a unique code (with retry logic in case of collisions)
        do {
            newCode = generateStudentGuardianCode();
            attempts++;

            // Check if code already exists
            const codeCheckQuery = {
                $users: {
                    $: {
                        where: {
                            studentGuardianCode: newCode,
                        },
                    },
                },
            };

            // Client DB uses queryOnce, admin DB uses query
            const codeCheckResult = await (db.queryOnce ? db.queryOnce(codeCheckQuery) : db.query(codeCheckQuery));
            const codeCheckData = (codeCheckResult as any).data ?? codeCheckResult;
            const existingUser = codeCheckData?.$users?.[0];

            if (!existingUser) {
                // Code is unique, break out of loop
                break;
            }

            if (attempts >= maxAttempts) {
                throw new Error(
                    "Failed to generate unique student guardian code after multiple attempts"
                );
            }
        } while (attempts < maxAttempts);

        // Update student with new code
        await db.tx.$users[studentId].update({
            studentGuardianCode: newCode,
        });

        return newCode;
    } catch (error) {
        console.error(
            `[Guardian Utils] Error ensuring student guardian code for ${studentId}:`,
            error
        );
        throw error;
    }
}
