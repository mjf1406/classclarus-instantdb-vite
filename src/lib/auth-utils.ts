/** @format */

import { redirect } from "@tanstack/react-router";
import type { AuthContextValue } from "@/components/auth/auth-provider";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";
import { db } from "@/lib/db/db";

/**
 * Check if a route is publicly accessible (no authentication required)
 * Only the root route `/` is public and serves as the login page
 */
export function isPublicRoute(pathname: string): boolean {
    // Normalize pathname - remove trailing slashes for comparison
    const normalized = pathname.replace(/\/$/, "") || "/";
    return normalized === "/";
}

/**
 * Check if user has access to an organization
 * User has access if they are:
 * - The owner
 * - An admin
 * - A teacher (org-level)
 * - Or if they are a member of any class within that org (checked via permissions)
 */
export function checkOrgAccess(
    orgId: string,
    userOrganizations: OrganizationWithRelations[]
): boolean {
    if (!orgId) {
        return false;
    }

    // Check if user is owner/admin/teacher of the org
    const org = userOrganizations.find((o) => o.id === orgId);
    if (org) {
        return true;
    }

    // Note: Users who are members of classes within the org can view the org
    // This is handled by the isInOrgClass permission check in instant.perms.ts
    // For now, we only check explicit org roles here
    // The permission system will allow viewing if user is in a class
    return false;
}

/**
 * Check if user has access to a class
 * User has access if:
 * - They are the owner of the class
 * - They are a class admin
 * - They are a member (teacher, assistant teacher, student, or parent)
 * - The class belongs to an organization they have access to
 */
export async function checkClassAccess(
    classId: string,
    userId: string | undefined,
    userOrganizations: OrganizationWithRelations[]
): Promise<boolean> {
    if (!classId || !userId) {
        return false;
    }

    // First check: organization-based access
    for (const org of userOrganizations) {
        // Check if class belongs to this org and user has access
        const hasClass = org.classes?.some((c) => c.id === classId);
        if (hasClass) {
            return true;
        }
    }

    // Second check: direct class membership
    // Query the class to check if user is directly linked
    const classQuery = {
        classes: {
            $: { where: { id: classId } },
            owner: {},
            classAdmins: {},
            classTeachers: {},
            classAssistantTeachers: {},
            classStudents: {},
            classParents: {},
        },
    };

    const { data } = await db.queryOnce(classQuery);
    const classEntity = data?.classes?.[0];

    if (!classEntity) {
        return false;
    }

    // Check if user is linked in any role
    const isOwner = classEntity.owner?.id === userId;
    const isAdmin = classEntity.classAdmins?.some(
        (admin: { id: string }) => admin.id === userId
    );
    const isTeacher = classEntity.classTeachers?.some(
        (teacher: { id: string }) => teacher.id === userId
    );
    const isAssistantTeacher = classEntity.classAssistantTeachers?.some(
        (at: { id: string }) => at.id === userId
    );
    const isStudent = classEntity.classStudents?.some(
        (student: { id: string }) => student.id === userId
    );
    const isParent = classEntity.classParents?.some(
        (parent: { id: string }) => parent.id === userId
    );

    return (
        isOwner ||
        isAdmin ||
        isTeacher ||
        isAssistantTeacher ||
        isStudent ||
        isParent
    );
}

/**
 * Determine if user is authorized for a specific route
 * Returns true if authorized, false if not authorized
 */
export async function isAuthorizedForRoute(
    pathname: string,
    authContext: AuthContextValue | undefined
): Promise<boolean> {
    // If no auth context, user is not authenticated (handled separately)
    if (!authContext || !authContext.user?.id) {
        return false;
    }

    // Parse route to check for organization or class access requirements
    const pathParts = pathname.split("/").filter(Boolean);

    // Check organization routes: /organizations/$orgId/*
    const orgIndex = pathParts.indexOf("organizations");
    if (orgIndex !== -1 && pathParts.length > orgIndex + 1) {
        const orgId = pathParts[orgIndex + 1];
        if (orgId && orgId !== "index") {
            // Check if user has access to this organization
            const hasAccess = checkOrgAccess(orgId, authContext.organizations);
            if (!hasAccess) {
                return false;
            }
        }
    }

    // Check class routes: /classes/$classId/*
    const classIndex = pathParts.indexOf("classes");
    if (classIndex !== -1 && pathParts.length > classIndex + 1) {
        const classId = pathParts[classIndex + 1];
        if (classId && classId !== "index") {
            // Check if user has access to this class
            const hasAccess = await checkClassAccess(
                classId,
                authContext.user.id,
                authContext.organizations
            );
            if (!hasAccess) {
                return false;
            }
        }
    }

    // For all other routes, if user is authenticated, they are authorized
    // (unless specific route-level checks are needed)
    return true;
}

/**
 * Require authentication - throws redirect if user is not authenticated
 * Use this in beforeLoad for routes that require authentication
 */
export function requireAuth(
    context: { auth: AuthContextValue | undefined },
    location: { href: string }
): void {
    // Check if user is authenticated
    if (!context.auth || !context.auth.user?.id) {
        // User is not authenticated - redirect to login page
        throw redirect({
            to: "/",
            search: {
                // Use the current location to power a redirect after login
                redirect: location.href,
            },
        });
    }

    // Wait for auth to finish loading
    if (context.auth.isLoading) {
        // If still loading, we can't make authorization decisions yet
        // In practice, this should be rare, but we'll allow it to proceed
        // The component will handle the loading state
        return;
    }
}

/**
 * Require organization access - throws redirect if user doesn't have access
 * Use this in beforeLoad for organization-scoped routes
 */
export function requireOrgAccess(
    orgId: string,
    context: { auth: AuthContextValue | undefined },
    location: { href: string }
): void {
    // First ensure user is authenticated
    requireAuth(context, location);

    // Check if user has access to this organization
    const hasAccess = checkOrgAccess(orgId, context.auth!.organizations);

    if (!hasAccess) {
        // User is authenticated but not authorized - redirect to blocked page
        throw redirect({
            to: "/blocked",
        });
    }
}

/**
 * Require class access - throws redirect if user doesn't have access
 * Use this in beforeLoad for class-scoped routes
 */
export async function requireClassAccess(
    classId: string,
    context: { auth: AuthContextValue | undefined },
    location: { href: string }
): Promise<void> {
    // First ensure user is authenticated
    requireAuth(context, location);

    const userId = context.auth!.user?.id;
    const hasAccess = await checkClassAccess(
        classId,
        userId,
        context.auth!.organizations
    );

    if (!hasAccess) {
        // User is authenticated but not authorized - redirect to blocked page
        throw redirect({
            to: "/blocked",
        });
    }
}
