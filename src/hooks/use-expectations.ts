/** @format */

import { useMemo } from "react";
import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

type Expectation = InstaQLEntity<AppSchema, "expectations", { class?: {} }>;
type StudentExpectation = InstaQLEntity<
    AppSchema,
    "student_expectations",
    { expectation?: {}; student?: {}; class?: {} }
>;

type ExpectationsQueryResult = {
    expectations: Expectation[];
};

type StudentExpectationsQueryResult = {
    student_expectations: StudentExpectation[];
};

/**
 * Hook to fetch expectations for a class and student expectations for a specific student
 * @param classId - The ID of the class
 * @param studentId - The ID of the student (optional, if not provided, only expectations are returned)
 * @returns Object containing expectations, studentExpectations, and a map for quick lookup
 */
export function useExpectations(
    classId: string | undefined,
    studentId?: string | undefined
) {
    const hasValidClassId = classId && classId.trim() !== "";

    const expectationsQuery = hasValidClassId
        ? {
              expectations: {
                  $: { where: { "class.id": classId } },
                  class: {},
              },
          }
        : null;

    const studentExpectationsQuery =
        hasValidClassId && studentId && studentId.trim() !== ""
            ? {
                  student_expectations: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": studentId },
                              ],
                          },
                      },
                      expectation: {},
                      student: {},
                      class: {},
                  },
              }
            : null;

    const { data: expectationsData } = db.useQuery(expectationsQuery);
    const { data: studentExpectationsData } = db.useQuery(
        studentExpectationsQuery
    );

    const typedExpectations =
        (expectationsData as ExpectationsQueryResult | undefined) ?? null;
    const expectations = typedExpectations?.expectations ?? [];

    const typedStudentExpectations =
        (studentExpectationsData as StudentExpectationsQueryResult | undefined) ??
        null;
    const studentExpectations = typedStudentExpectations?.student_expectations ?? [];

    // Create a map for quick lookup: expectationId -> studentExpectation
    const studentExpectationMap = useMemo(() => {
        const map = new Map<string, StudentExpectation>();
        for (const se of studentExpectations) {
            const expectationId = se.expectation?.id;
            if (expectationId) {
                map.set(expectationId, se);
            }
        }
        return map;
    }, [studentExpectations]);

    return {
        expectations,
        studentExpectations,
        studentExpectationMap,
        isLoading: !hasValidClassId,
    };
}
