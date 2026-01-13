/** @format */

import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useAuthContext } from "@/components/auth/auth-provider";

export type OrganizationWithRelations = InstaQLEntity<
    AppSchema,
    "organizations",
    {
        owner: {};
        orgStudents: {};
        orgTeachers: {};
        orgParents: {};
        admins: {};
        joinCodeEntity: {};
        classes: {
            owner: {};
            classAdmins: {};
            classTeachers: {};
        };
    }
>;

type OrgQueryResult = {
    organizations: OrganizationWithRelations[];
};

export function useOrganizationsByUserId(userId: string | undefined) {
    const hasValidUser = userId && userId.trim() !== "";

    const orgQuery = hasValidUser
        ? {
              organizations: {
                  $: {
                      where: {
                          or: [
                              { "owner.id": userId },
                              { "admins.id": userId },
                              { "orgStudents.id": userId },
                              { "orgTeachers.id": userId },
                              { "orgParents.id": userId },
                          ],
                      },
                  },
                  owner: {},
                  orgStudents: {},
                  orgTeachers: {},
                  orgParents: {},
                  admins: {},
                  joinCodeEntity: {},
                  classes: {
                      owner: {},
                      classAdmins: {},
                      classTeachers: {},
                  },
              },
          }
        : null;

    const { data: orgData, isLoading, error } = db.useQuery(orgQuery);

    const typedOrgData = (orgData as OrgQueryResult | undefined) ?? null;
    const organizations = typedOrgData?.organizations || [];

    return {
        organizations,
        isLoading,
        error,
    };
}

export function useOrganizationById(orgId: string | undefined) {
    const { organizations, isLoading, error } = useAuthContext();

    const organization = orgId
        ? organizations.find((org) => org.id === orgId)
        : undefined;

    return {
        organization,
        isLoading,
        error,
    };
}
