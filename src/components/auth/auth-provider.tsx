/** @format */

import React, { createContext, useContext } from "react";
import { db } from "@/lib/db/db";
import type { OrganizationWithRelations } from "@/hooks/use-organgization-hooks";
import { useOrganizationsByUserId } from "@/hooks/use-organgization-hooks";

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

    // If there's no user, we're done loading (no user = not authenticated, not loading)
    // If there is a user, wait for all queries to complete
    const isLoading = authLoading
        ? true
        : hasValidUser
          ? dataLoading || orgLoading
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
        error: orgError,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
