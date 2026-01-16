/** @format */

import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useAuthContext } from "@/components/auth/auth-provider";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgRole } from "@/routes/organizations/-components/navigation/use-org-role";

// Base type with all relations
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

// Role-specific types
export type ClassForOwner = ClassWithRelations;

export type ClassForAdmin = ClassWithRelations;

export type ClassForTeacher = InstaQLEntity<
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

export type ClassForAssistantTeacher = InstaQLEntity<
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

export type ClassForParent = InstaQLEntity<
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

export type ClassForStudent = InstaQLEntity<
    AppSchema,
    "classes",
    {
        owner: {};
        organization: {};
        classAdmins: {};
        classTeachers: {};
        classAssistantTeachers: {};
        classParents: {};
        classStudents: {};
    }
>;

type ClassQueryResult<T = ClassWithRelations> = {
    classes: T[];
};

type UserWithChildren = InstaQLEntity<
    AppSchema,
    "$users",
    {
        children: {};
    }
>;

type UserQueryResult = {
    $users: UserWithChildren[];
};

/**
 * @deprecated Use useClassesByRole instead for role-based filtering
 * Fetches classes where the user is a member (owner, admin, teacher, assistant teacher, student, or parent)
 */
export function useClassesByOrgId(orgId: string | undefined) {
    const { user } = useAuthContext();
    const userId = user?.id;
    const hasValidOrgId = orgId && orgId.trim() !== "";
    const hasValidUser = userId && userId.trim() !== "";

    const classQuery =
        hasValidOrgId && hasValidUser
            ? {
                  classes: {
                      $: {
                          where: {
                              and: [
                                  { "organization.id": orgId },
                                  { archivedAt: { $isNull: true } },
                                  {
                                      or: [
                                          { "owner.id": userId },
                                          { "classAdmins.id": userId },
                                          { "classTeachers.id": userId },
                                          {
                                              "classAssistantTeachers.id":
                                                  userId,
                                          },
                                          { "classStudents.id": userId },
                                          { "classParents.id": userId },
                                      ],
                                  },
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
    console.log("🚀 ~ useClassesForParent ~ classes:", classes);
    console.log("🚀 ~ useClassesForStudent ~ classes:", classes);
    console.log("🚀 ~ useClassesForStudent ~ classes:", classes);
    console.log("🚀 ~ useClassesForStudent ~ classes:", classes);

    return {
        classes,
        isLoading,
        error,
    };
}

/**
 * Fetches all classes in the organization (for owners)
 * Returns classes with all relations: owner, organization, classAdmins, classTeachers, classAssistantTeachers, classStudents, classParents
 */
export function useClassesForOwner(orgId: string | undefined) {
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

    const typedClassData =
        (classData as ClassQueryResult<ClassForOwner> | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    return {
        classes,
        isLoading,
        error,
    };
}

/**
 * Fetches all classes in the organization (for admins)
 * Returns classes with all relations: owner, organization, classAdmins, classTeachers, classAssistantTeachers, classStudents, classParents
 */
export function useClassesForAdmin(orgId: string | undefined) {
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

    const typedClassData =
        (classData as ClassQueryResult<ClassForAdmin> | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    return {
        classes,
        isLoading,
        error,
    };
}

/**
 * Fetches classes where the user is a teacher
 * Returns classes with relations: owner, organization, classTeachers, classAssistantTeachers, classStudents, classParents
 */
export function useClassesForTeacher(orgId: string | undefined) {
    const { user } = useAuthContext();
    const userId = user?.id;
    const hasValidOrgId = orgId && orgId.trim() !== "";
    const hasValidUser = userId && userId.trim() !== "";

    const classQuery =
        hasValidOrgId && hasValidUser
            ? {
                  classes: {
                      $: {
                          where: {
                              and: [
                                  { "organization.id": orgId },
                                  { archivedAt: { $isNull: true } },
                                  { "classTeachers.id": userId },
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

    const typedClassData =
        (classData as ClassQueryResult<ClassForTeacher> | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    return {
        classes,
        isLoading,
        error,
    };
}

/**
 * Fetches classes where the user is an assistant teacher
 * Returns classes with relations: owner, organization, classTeachers, classStudents, classParents
 */
export function useClassesForAssistantTeacher(orgId: string | undefined) {
    const { user } = useAuthContext();
    const userId = user?.id;
    const hasValidOrgId = orgId && orgId.trim() !== "";
    const hasValidUser = userId && userId.trim() !== "";

    const classQuery =
        hasValidOrgId && hasValidUser
            ? {
                  classes: {
                      $: {
                          where: {
                              and: [
                                  { "organization.id": orgId },
                                  { archivedAt: { $isNull: true } },
                                  { "classAssistantTeachers.id": userId },
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

    const typedClassData =
        (classData as ClassQueryResult<ClassForAssistantTeacher> | undefined) ??
        null;
    const classes = typedClassData?.classes || [];

    return {
        classes,
        isLoading,
        error,
    };
}

/**
 * Fetches classes where the user's children are students
 * Returns classes with relations: owner, organization, classAdmins, classTeachers, classAssistantTeachers, classStudents
 */
export function useClassesForParent(orgId: string | undefined) {
    const { user } = useAuthContext();
    const userId = user?.id;
    const hasValidOrgId = orgId && orgId.trim() !== "";
    const hasValidUser = userId && userId.trim() !== "";

    // First, get the user's children
    const userQuery = hasValidUser
        ? {
              $users: {
                  $: {
                      where: {
                          id: userId,
                      },
                  },
                  children: {},
              },
          }
        : null;

    const { data: userData, isLoading: userLoading } = db.useQuery(userQuery);
    const typedUserData = (userData as UserQueryResult | undefined) ?? null;
    const currentUser = typedUserData?.$users?.[0];
    const childrenIds =
        currentUser?.children?.map((child) => child.id).filter(Boolean) || [];

    // Then, find classes where any of the children are students
    const classQuery =
        hasValidOrgId && hasValidUser && childrenIds.length > 0
            ? {
                  classes: {
                      $: {
                          where: {
                              and: [
                                  { "organization.id": orgId },
                                  { archivedAt: { $isNull: true } },
                                  { "classStudents.id": { $in: childrenIds } },
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

    const {
        data: classData,
        isLoading: classLoading,
        error,
    } = db.useQuery(classQuery);

    const typedClassData =
        (classData as ClassQueryResult<ClassForParent> | undefined) ?? null;
    const classes = typedClassData?.classes || [];
    return {
        classes,
        isLoading: userLoading || classLoading,
        error,
    };
}

/**
 * Fetches classes where the user is enrolled as a student
 * Returns classes with relations: owner, organization, classAdmins, classTeachers, classAssistantTeachers, classStudents
 */
export function useClassesForStudent(orgId: string | undefined) {
    const { user } = useAuthContext();
    const userId = user?.id;
    const hasValidOrgId = orgId && orgId.trim() !== "";
    const hasValidUser = userId && userId.trim() !== "";

    const classQuery =
        hasValidOrgId && hasValidUser
            ? {
                  classes: {
                      $: {
                          where: {
                              and: [
                                  { "organization.id": orgId },
                                  { archivedAt: { $isNull: true } },
                                  { "classStudents.id": userId },
                              ],
                          },
                      },
                      owner: {},
                      organization: {},
                      classAdmins: {},
                      classTeachers: {},
                      classAssistantTeachers: {},
                      classParents: {},
                      classStudents: {},
                  },
              }
            : null;

    const { data: classData, isLoading, error } = db.useQuery(classQuery);

    const typedClassData =
        (classData as ClassQueryResult<ClassForStudent> | undefined) ?? null;
    const classes = typedClassData?.classes || [];
    return {
        classes,
        isLoading,
        error,
    };
}

// Union type for all possible class types returned by role-based hooks
export type ClassByRole =
    | ClassForOwner
    | ClassForAdmin
    | ClassForTeacher
    | ClassForAssistantTeacher
    | ClassForParent
    | ClassForStudent;

/**
 * Main hook that automatically selects the appropriate role-based hook based on the user's role in the organization
 * Returns classes filtered and with relations appropriate for the user's role
 */
export function useClassesByRole(orgId: string | undefined) {
    const { organization, isLoading: orgLoading } = useOrganizationById(orgId);
    const roleInfo = useOrgRole(organization);

    // Use appropriate hook based on role
    const ownerResult = useClassesForOwner(
        roleInfo.isOwner ? orgId : undefined
    );
    const adminResult = useClassesForAdmin(
        roleInfo.isAdmin ? orgId : undefined
    );
    const teacherResult = useClassesForTeacher(
        roleInfo.isTeacher ? orgId : undefined
    );

    // Determine which result to use based on role priority
    if (orgLoading || !organization || !roleInfo.role) {
        return {
            classes: [] as ClassByRole[],
            isLoading: true,
            error: null,
        };
    }

    if (roleInfo.isOwner) {
        return {
            ...ownerResult,
            classes: ownerResult.classes as ClassByRole[],
        };
    }
    if (roleInfo.isAdmin) {
        return {
            ...adminResult,
            classes: adminResult.classes as ClassByRole[],
        };
    }
    if (roleInfo.isTeacher) {
        return {
            ...teacherResult,
            classes: teacherResult.classes as ClassByRole[],
        };
    }

    // No org role found (user is not owner/admin/teacher of org)
    return {
        classes: [] as ClassByRole[],
        isLoading: false,
        error: null,
    };
}

/**
 * Fetches all archived classes in the organization (for owners)
 * Returns classes with all relations: owner, organization, classAdmins, classTeachers, classAssistantTeachers, classStudents, classParents
 */
export function useArchivedClassesForOwner(orgId: string | undefined) {
    const hasValidOrgId = orgId && orgId.trim() !== "";

    const classQuery = hasValidOrgId
        ? {
              classes: {
                  $: {
                      where: {
                          and: [
                              { "organization.id": orgId },
                              { archivedAt: { $isNull: false } },
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

    const typedClassData =
        (classData as ClassQueryResult<ClassForOwner> | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    return {
        classes,
        isLoading,
        error,
    };
}

/**
 * Fetches all archived classes in the organization (for admins)
 * Returns classes with all relations: owner, organization, classAdmins, classTeachers, classAssistantTeachers, classStudents, classParents
 */
export function useArchivedClassesForAdmin(orgId: string | undefined) {
    const hasValidOrgId = orgId && orgId.trim() !== "";

    const classQuery = hasValidOrgId
        ? {
              classes: {
                  $: {
                      where: {
                          and: [
                              { "organization.id": orgId },
                              { archivedAt: { $isNull: false } },
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

    const typedClassData =
        (classData as ClassQueryResult<ClassForAdmin> | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    return {
        classes,
        isLoading,
        error,
    };
}

/**
 * Main hook that automatically selects the appropriate role-based hook for archived classes
 * Returns archived classes filtered and with relations appropriate for the user's role
 */
export function useArchivedClassesByRole(orgId: string | undefined) {
    const { organization, isLoading: orgLoading } = useOrganizationById(orgId);
    const roleInfo = useOrgRole(organization);

    // Use appropriate hook based on role
    const ownerResult = useArchivedClassesForOwner(
        roleInfo.isOwner ? orgId : undefined
    );
    const adminResult = useArchivedClassesForAdmin(
        roleInfo.isAdmin ? orgId : undefined
    );

    // Determine which result to use based on role priority
    if (orgLoading || !organization || !roleInfo.role) {
        return {
            classes: [] as ClassByRole[],
            isLoading: true,
            error: null,
        };
    }

    if (roleInfo.isOwner) {
        return {
            ...ownerResult,
            classes: ownerResult.classes as ClassByRole[],
        };
    }
    if (roleInfo.isAdmin) {
        return {
            ...adminResult,
            classes: adminResult.classes as ClassByRole[],
        };
    }

    // Only owners and admins can see archived classes
    return {
        classes: [] as ClassByRole[],
        isLoading: false,
        error: null,
    };
}
