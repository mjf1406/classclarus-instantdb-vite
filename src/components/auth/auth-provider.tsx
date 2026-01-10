/** @format */

"use client";

import React, { createContext, useContext } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { db } from "@/lib/db/db";

type OrganizationWithRelations = InstaQLEntity<
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

interface AuthContextValue {
    user: {
        created_at: Date | null | string;
        email: string;
        id: string;
        imageURL: string | null;
        avatarURL: string | null;
        isGuest: boolean;
        polarCustomerId: string | null;
        refresh_token: string | null;
        updated_at: Date | null | string;
        type: string;
        firstName: string | null;
        lastName: string | null;
        plan: string;
    };
    isLoading: boolean;
    organizations: OrganizationWithRelations[];
    error: { message: string } | null | undefined;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading: authLoading } = db.useAuth();

    const { data, isLoading: dataLoading } = db.useQuery(
        user?.id
            ? {
                  $users: {
                      $: { where: { id: user.id } },
                  },
              }
            : null
    );

    const userData = data?.$users?.[0];

    const orgQuery = user
        ? {
              organizations: {
                  $: {
                      where: {
                          or: [
                              { "owner.id": user.id },
                              { "admins.id": user.id },
                              { "orgStudents.id": user.id },
                              { "orgTeachers.id": user.id },
                              { "orgParents.id": user.id },
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

    const {
        data: orgData,
        isLoading: orgLoading,
        error: orgError,
    } = db.useQuery(orgQuery);

    const typedOrgData = (orgData as OrgQueryResult | undefined) ?? null;

    const value: AuthContextValue = {
        user: {
            created_at: userData?.created || "",
            email: user?.email || "",
            id: user?.id || "",
            imageURL: user?.imageURL || null,
            avatarURL: userData?.avatarURL || null,
            isGuest: user?.isGuest || false,
            polarCustomerId: userData?.polarCustomerId || null,
            refresh_token: user?.refresh_token || null,
            updated_at: userData?.updated || null,
            type: userData?.type || "guest",
            firstName: userData?.firstName || null,
            lastName: userData?.lastName || null,
            plan: userData?.plan || "free",
        },
        isLoading: authLoading || dataLoading || orgLoading,
        organizations: typedOrgData?.organizations || [],
        error: orgError,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
