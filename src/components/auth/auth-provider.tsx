/** @format */

import React, { createContext, useContext } from "react";
import { db } from "@/lib/db/db";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";
import { useOrganizationsByUserId } from "@/hooks/use-organization-hooks";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export interface AuthContextValue {
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
    classIds: string[];
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

    // Only query user data if we have a valid user ID
    const hasValidUser = user?.id && user.id.trim() !== "";

    const { data, isLoading: dataLoading } = db.useQuery(
        hasValidUser
            ? {
                  $users: {
                      $: { where: { id: user.id } },
                  },
              }
            : null
    );

    const userData = data?.$users?.[0];

    const {
        organizations,
        isLoading: orgLoading,
        error: orgError,
    } = useOrganizationsByUserId(user?.id);

    // Query user's children for guardian role
    const { data: userWithChildrenData, isLoading: userChildrenLoading } =
        db.useQuery(
            hasValidUser
                ? {
                      $users: {
                          $: { where: { id: user.id } },
                          children: {},
                      },
                  }
                : null
        );

    const childrenIds =
        userWithChildrenData?.$users?.[0]?.children?.map((c) => c.id) || [];

    // Query class IDs where user is a member
    type ClassQueryResult = {
        classes: InstaQLEntity<AppSchema, "classes">[];
    };

    const { data: classData, isLoading: classLoading } = db.useQuery(
        hasValidUser
            ? {
                  classes: {
                      $: {
                          where: {
                              or: [
                                  { "owner.id": user.id },
                                  { "classAdmins.id": user.id },
                                  { "classTeachers.id": user.id },
                                  { "classAssistantTeachers.id": user.id },
                                  { "classStudents.id": user.id },
                                  { "classGuardians.id": user.id },
                                  ...(childrenIds.length > 0
                                      ? [
                                            {
                                                "classStudents.id": {
                                                    $in: childrenIds,
                                                },
                                            },
                                        ]
                                      : []),
                              ],
                          },
                      },
                  },
              }
            : null
    );

    const typedClassData = (classData as ClassQueryResult | undefined) ?? null;
    const classIds = typedClassData?.classes?.map((c) => c.id) || [];

    // If there's no user, we're done loading (no user = not authenticated, not loading)
    // If there is a user, wait for all queries to complete
    const isLoading = authLoading
        ? true
        : hasValidUser
          ? dataLoading || orgLoading || userChildrenLoading || classLoading
          : false;

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
        isLoading,
        organizations,
        classIds,
        error: orgError,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
