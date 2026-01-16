/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
import type { ClassByRole } from "@/hooks/use-class-hooks";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type UserEntity = InstaQLEntity<AppSchema, "$users", {}>;

export type ClassRole =
    | "owner"
    | "admin"
    | "teacher"
    | "assistant-teacher"
    | "guardian"
    | "student"
    | null;

export interface ClassRoleInfo {
    role: ClassRole;
    isOwner: boolean;
    isAdmin: boolean;
    isTeacher: boolean;
    isAssistantTeacher: boolean;
    isGuardian: boolean;
    isStudent: boolean;
}

export function useClassRole(
    classEntity: ClassByRole | undefined
): ClassRoleInfo {
    const { user } = useAuthContext();
    const userId = user?.id;

    if (!classEntity || !userId) {
        return {
            role: null,
            isOwner: false,
            isAdmin: false,
            isTeacher: false,
            isAssistantTeacher: false,
            isGuardian: false,
            isStudent: false,
        };
    }

    // Determine user's role in the class (priority: Owner > Admin > Teacher > Assistant Teacher > Guardian > Student)
    const isOwner = !!(userId && classEntity.owner?.id === userId);
    const isAdmin =
        !!(
            userId &&
            !isOwner &&
            classEntity.classAdmins?.some((admin: UserEntity) => admin.id === userId)
        );
    const isTeacher =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            classEntity.classTeachers?.some((teacher: UserEntity) => teacher.id === userId)
        );
    const isAssistantTeacher =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            !isTeacher &&
            classEntity.classAssistantTeachers?.some(
                (assistantTeacher: UserEntity) => assistantTeacher.id === userId
            )
        );
    const isStudent =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            !isTeacher &&
            !isAssistantTeacher &&
            classEntity.classStudents?.some((student: UserEntity) => student.id === userId)
        );
    const isGuardian =
        !!(
            userId &&
            !isOwner &&
            !isAdmin &&
            !isTeacher &&
            !isAssistantTeacher &&
            !isStudent &&
            classEntity.classGuardians?.some((guardian: UserEntity) => guardian.id === userId)
        );

    const role: ClassRole = isOwner
        ? "owner"
        : isAdmin
          ? "admin"
          : isTeacher
            ? "teacher"
            : isAssistantTeacher
              ? "assistant-teacher"
              : isGuardian
                ? "guardian"
                : isStudent
                  ? "student"
                  : null;

    return {
        role,
        isOwner,
        isAdmin,
        isTeacher,
        isAssistantTeacher,
        isGuardian,
        isStudent,
    };
}
