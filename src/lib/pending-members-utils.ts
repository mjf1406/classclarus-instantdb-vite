/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";
import { getGuardianLinkTransactions } from "@/lib/guardian-utils";

type PendingMember = InstaQLEntity<AppSchema, "pendingMembers", { class: {} }>;

/**
 * Auto-join user to classes based on pending member invitations
 * @param userEmail - The email address of the newly signed up user
 * @param userId - The user ID of the newly signed up user
 */
export async function autoJoinPendingClasses(
    userEmail: string,
    userId: string
): Promise<void> {
    if (!userEmail || !userId) {
        return;
    }

    try {
        // Normalize email
        const normalizedEmail = userEmail.toLowerCase().trim();

        // Query for pending members with matching email
        const { data } = await db.queryOnce({
            pendingMembers: {
                $: {
                    where: {
                        email: normalizedEmail,
                    },
                },
                class: {},
            },
        });

        const pendingMembers = (data?.pendingMembers as unknown as PendingMember[]) || [];

        if (pendingMembers.length === 0) {
            return;
        }

        // Group by class and role
        const classRoleMap = new Map<
            string,
            { classId: string; role: "student" | "teacher" | "guardian" }
        >();

        for (const pending of pendingMembers) {
            if (!pending.class?.id) continue;
            const key = `${pending.class.id}_${pending.role}`;
            if (!classRoleMap.has(key)) {
                classRoleMap.set(key, {
                    classId: pending.class.id,
                    role: pending.role as "student" | "teacher" | "guardian",
                });
            }
        }

        // Join user to classes
        const transactions: any[] = [];

        for (const { classId, role } of classRoleMap.values()) {
            let linkLabel: "classStudents" | "classTeachers" | "classGuardians";

            if (role === "student") {
                linkLabel = "classStudents";
            } else if (role === "teacher") {
                linkLabel = "classTeachers";
            } else {
                linkLabel = "classGuardians";
            }

            transactions.push(
                db.tx.classes[classId].link({
                    [linkLabel]: userId,
                })
            );
        }

        // If user is joining as student, also add their guardians to those classes
        const studentClassIds = Array.from(classRoleMap.values())
            .filter(({ role }) => role === "student")
            .map(({ classId }) => classId);

        if (studentClassIds.length > 0) {
            // Query guardians for each class where user is joining as student
            const guardianPromises = studentClassIds.map((classId) =>
                getGuardianLinkTransactions(db, userId, classId)
            );

            // Wait for all guardian queries to complete
            const guardianTransactionArrays = await Promise.all(
                guardianPromises
            );
            // Flatten the arrays into a single array
            transactions.push(...guardianTransactionArrays.flat());
        }

        // Delete pending member records
        for (const pending of pendingMembers) {
            transactions.push(db.tx.pendingMembers[pending.id].delete());
        }

        if (transactions.length > 0) {
            await db.transact(transactions);
        }
    } catch (error) {
        console.error("Error auto-joining pending classes:", error);
        // Don't throw - we don't want to block signup if this fails
    }
}
