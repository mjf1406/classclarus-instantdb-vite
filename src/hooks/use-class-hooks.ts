/** @format */

import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export type ClassWithRelations = InstaQLEntity<
    AppSchema,
    "classes",
    {
        owner: {};
        organization: {};
        classAdmins: {};
        classTeachers: {};
        classAssistantTeachers: {};
        classStudents: {};
        classParents: {};
    }
>;

type ClassQueryResult = {
    classes: ClassWithRelations[];
};

export function useClassesByOrgId(orgId: string | undefined) {
    const hasValidOrgId = orgId && orgId.trim() !== "";

    const classQuery = hasValidOrgId
        ? {
              classes: {
                  $: {
                      where: {
                          and: [
                              { "organization.id": orgId },
                              { archivedAt: { $isNull: true } },
                          ],
                      },
                  },
                  owner: {},
                  organization: {},
                  classAdmins: {},
                  classTeachers: {},
                  classAssistantTeachers: {},
                  classStudents: {},
                  classParents: {},
              },
          }
        : null;

    const { data: classData, isLoading, error } = db.useQuery(classQuery);

    const typedClassData = (classData as ClassQueryResult | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    return {
        classes,
        isLoading,
        error,
    };
}
