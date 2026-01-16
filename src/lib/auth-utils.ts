/** @format */

import { redirect } from "@tanstack/react-router";
import type { AuthContextValue } from "@/components/auth/auth-provider";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";

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
 * - They are a member (teacher, assistant teacher, student, or guardian)
 * - The class belongs to an organization they have access to
 */
export function checkClassAccess(
    classId: string,
    userId: string | undefined,
    userOrganizations: OrganizationWithRelations[],
    classIds: string[]
): boolean {
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

    // Second check: direct class membership (from pre-loaded classIds)
    return classIds.includes(classId);
}

/**
 * Determine if user is authorized for a specific route
 * Returns true if authorized, false if not authorized
 */
export function isAuthorizedForRoute(
    pathname: string,
    authContext: AuthContextValue | undefined
): boolean {
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
            const hasAccess = checkClassAccess(
                classId,
                authContext.user.id,
                authContext.organizations,
                authContext.classIds
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
    // If auth context is not yet available (undefined), don't redirect
    // The route will load and the component will handle the loading state
    if (!context.auth) {
        return;
    }

    // If auth is still loading, don't redirect yet
    // The route will load and show the loading state
    if (context.auth.isLoading) {
        return;
    }

    // Now we know auth is loaded - check if user is authenticated
    if (!context.auth.user?.id) {
        // User is not authenticated - redirect to login page
        throw redirect({
            to: "/",
            search: {
                // Use the current location to power a redirect after login
                redirect: location.href,
            },
        });
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
export function requireClassAccess(
    classId: string,
    context: { auth: AuthContextValue | undefined },
    location: { href: string }
): void {
    // First ensure user is authenticated
    requireAuth(context, location);

    const userId = context.auth!.user?.id;
    const hasAccess = checkClassAccess(
        classId,
        userId,
        context.auth!.organizations,
        context.auth!.classIds
    );

    if (!hasAccess) {
        // User is authenticated but not authorized - redirect to blocked page
        throw redirect({
            to: "/blocked",
        });
    }
}
