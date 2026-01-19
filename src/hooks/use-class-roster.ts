/** @format */

import { useMemo } from "react";
import { db } from "@/lib/db/db";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

export type RosterEntry = {
    id: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    number?: number;
};

type ClassRosterEntity = InstaQLEntity<
    AppSchema,
    "class_roster",
    {
        student: {};
    }
>;

type ClassRosterQueryResult = {
    class_roster: ClassRosterEntity[];
};

/**
 * Hook to fetch and process class roster data for a given class
 * @param classId - The ID of the class to fetch roster data for
 * @returns Object containing rosterByStudentId Map, rosterEntries array, isLoading state, and getRosterForStudent helper
 */
export function useClassRoster(classId: string | undefined) {
    const hasValidClassId = classId && classId.trim() !== "";

    const rosterQuery = hasValidClassId
        ? {
              class_roster: {
                  $: { where: { "class.id": classId } },
                  student: {},
              },
          }
        : null;

    const { data: rosterData } = db.useQuery(rosterQuery);

    const typedRosterData =
        (rosterData as ClassRosterQueryResult | undefined) ?? null;
    const rosterList = typedRosterData?.class_roster ?? [];

    const rosterByStudentId = useMemo(() => {
        const m = new Map<string, RosterEntry>();
        for (const r of rosterList) {
            if (r.student?.id) {
                m.set(r.student.id, {
                    id: r.id,
                    firstName: r.firstName,
                    lastName: r.lastName,
                    gender: r.gender,
                    number: r.number,
                });
            }
        }
        return m;
    }, [rosterList]);

    const rosterEntries = useMemo(() => {
        return rosterList.map((r) => ({
            id: r.id,
            firstName: r.firstName,
            lastName: r.lastName,
            gender: r.gender,
            number: r.number,
        }));
    }, [rosterList]);

    const getRosterForStudent = (studentId: string): RosterEntry | null => {
        return rosterByStudentId.get(studentId) ?? null;
    };

    return {
        rosterByStudentId,
        rosterEntries,
        isLoading: !hasValidClassId,
        getRosterForStudent,
    };
}
