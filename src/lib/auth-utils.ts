/** @format */

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
 * - A member (teacher, assistant teacher, student, or parent)
 */
export function checkOrgAccess(
    orgId: string,
    userOrganizations: OrganizationWithRelations[]
): boolean {
    if (!orgId || userOrganizations.length === 0) {
        return false;
    }

    const org = userOrganizations.find((o) => o.id === orgId);
    return !!org;
}

/**
 * Check if user has access to a class
 * User has access if:
 * - They are the owner of the class
 * - They are a class admin
 * - They are a member (teacher, assistant teacher, student, or parent)
 * - The class belongs to an organization they have access to
 */
export function checkClassAccess(
    classId: string,
    userOrganizations: OrganizationWithRelations[]
): boolean {
    if (!classId || userOrganizations.length === 0) {
        return false;
    }

    // Check if user has access through any organization
    for (const org of userOrganizations) {
        // Check if class belongs to this org and user has access
        const hasClass = org.classes?.some((c) => c.id === classId);
        if (hasClass) {
            return true;
        }
    }

    // TODO: If classes can exist outside organizations or have direct membership,
    // add additional checks here

    return false;
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
            const hasAccess = checkOrgAccess(
                orgId,
                authContext.organizations
            );
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
