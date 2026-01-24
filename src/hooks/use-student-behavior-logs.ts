/** @format */

import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type BehaviorLog = InstaQLEntity<
    AppSchema,
    "behavior_logs",
    {
        behavior?: {};
        student?: {};
        createdBy?: {};
        class?: {};
    }
>;

type BehaviorLogsQueryResult = {
    behavior_logs: BehaviorLog[];
};

/**
 * Hook to fetch behavior logs for a student in a class
 * Supports guardian access - if studentId is a child's ID, guardians can view their data
 * @param classId - The ID of the class
 * @param studentId - The ID of the student (optional, if not provided returns empty array)
 * @returns Object containing behaviorLogs and isLoading state
 */
export function useStudentBehaviorLogs(
    classId: string | undefined,
    studentId: string | undefined
) {
    const hasValidClassId = classId && classId.trim() !== "";
    const hasValidStudentId = studentId && studentId.trim() !== "";

    const behaviorLogsQuery =
        hasValidClassId && hasValidStudentId
            ? {
                  behavior_logs: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": studentId },
                              ],
                          },
                          order: { createdAt: "desc" } as const,
                      },
                      behavior: {},
                      student: {},
                      createdBy: {},
                      class: {},
                  },
              }
            : null;

    const { data, isLoading } = db.useQuery(behaviorLogsQuery);

    const typedBehaviorLogs =
        (data as BehaviorLogsQueryResult | undefined) ?? null;
    const behaviorLogs = typedBehaviorLogs?.behavior_logs ?? [];

    return {
        behaviorLogs,
        isLoading: !hasValidClassId || !hasValidStudentId || isLoading,
    };
}
