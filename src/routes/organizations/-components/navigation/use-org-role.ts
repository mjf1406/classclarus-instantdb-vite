/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";

export type OrgRole =
    | "owner"
    | "admin"
    | "teacher"
    | "assistant-teacher"
    | "parent"
    | "student"
    | null;

export interface OrgRoleInfo {
    role: OrgRole;
    isOwner: boolean;
    isAdmin: boolean;
    isTeacher: boolean;
    isAssistantTeacher: boolean;
    isParent: boolean;
    isStudent: boolean;
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
            isAssistantTeacher: false,
            isParent: false,
            isStudent: false,
        };
    }

    // Determine user's role in the organization (priority: Owner > Admin > Teacher > Assistant Teacher > Parent > Student)
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
    const isAssistantTeacher =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            !isTeacher &&
            organization.orgAssistantTeachers?.some(
                (assistantTeacher) => assistantTeacher.id === userId
            )
        );
    const isStudent =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            !isTeacher &&
            !isAssistantTeacher &&
            organization.orgStudents?.some((student) => student.id === userId)
        );
    const isParent =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            !isTeacher &&
            !isAssistantTeacher &&
            !isStudent &&
            organization.orgParents?.some((parent) => parent.id === userId)
        );

    const role: OrgRole = isOwner
        ? "owner"
        : isAdmin
          ? "admin"
          : isTeacher
            ? "teacher"
            : isAssistantTeacher
              ? "assistant-teacher"
              : isParent
                ? "parent"
                : isStudent
                  ? "student"
                  : null;

    return {
        role,
        isOwner,
        isAdmin,
        isTeacher,
        isAssistantTeacher,
        isParent,
        isStudent,
    };
}
