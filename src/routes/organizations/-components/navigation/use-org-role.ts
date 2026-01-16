/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";

export type OrgRole = "owner" | "admin" | "teacher" | null;

export interface OrgRoleInfo {
    role: OrgRole;
    isOwner: boolean;
    isAdmin: boolean;
    isTeacher: boolean;
}

export function useOrgRole(
    organization: OrganizationWithRelations | undefined
): OrgRoleInfo {
    const { user } = useAuthContext();
    const userId = user?.id;

    if (!organization || !userId) {
        return {
            role: null,
            isOwner: false,
            isAdmin: false,
            isTeacher: false,
        };
    }

    // Determine user's role in the organization (priority: Owner > Admin > Teacher)
    const isOwner = !!(userId && organization.owner?.id === userId);
    const isAdmin =
        !!(
            userId &&
            !isOwner &&
            organization.admins?.some((admin) => admin.id === userId)
        );
    const isTeacher =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            organization.orgTeachers?.some((teacher) => teacher.id === userId)
        );

    const role: OrgRole = isOwner
        ? "owner"
        : isAdmin
          ? "admin"
          : isTeacher
            ? "teacher"
            : null;

    return {
        role,
        isOwner,
        isAdmin,
        isTeacher,
    };
}
