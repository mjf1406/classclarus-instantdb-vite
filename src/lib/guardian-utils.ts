/** @format */

import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

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

        const result = await db.query(query);
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
