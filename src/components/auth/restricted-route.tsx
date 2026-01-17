/** @format */

import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isRestrictedRole } from "@/lib/auth-utils";
import type { ClassRole } from "@/hooks/use-class-role";
import type { OrgRole } from "@/hooks/use-org-role";

interface RestrictedRouteProps {
    /**
     * The user's role in the current context (class or org)
     */
    role: ClassRole | OrgRole | null;
    /**
     * Whether the role data is still loading
     */
    isLoading?: boolean;
    /**
     * The back URL to navigate to when access is denied
     * Defaults to the parent route
     */
    backUrl?: string;
    /**
     * If true, also restricts access when role is null (for org-level restrictions)
     * This is useful for org pages where users without explicit org roles should be restricted
     */
    restrictNullRole?: boolean;
    /**
     * Children to render if access is allowed
     */
    children: React.ReactNode;
}

/**
 * A wrapper component that blocks students and guardians from accessing restricted routes.
 * Only allows access for owners, admins, teachers, and assistant teachers.
 * 
 * For class routes: blocks students and guardians
 * For org routes (with restrictNullRole=true): blocks anyone without an org role
 * 
 * Usage:
 * ```tsx
 * // For class routes
 * <RestrictedRoute role={roleInfo.role} backUrl="/classes/$classId">
 *   <YourRestrictedContent />
 * </RestrictedRoute>
 * 
 * // For org routes
 * <RestrictedRoute role={roleInfo.role} restrictNullRole backUrl="/organizations/$orgId">
 *   <YourRestrictedContent />
 * </RestrictedRoute>
 * ```
 */
export function RestrictedRoute({
    role,
    isLoading = false,
    backUrl,
    restrictNullRole = false,
    children,
}: RestrictedRouteProps) {
    const navigate = useNavigate();

    // If still loading, show nothing or a loader
    if (isLoading) {
        return null;
    }

    // Check if user should be restricted
    // For classes: restrict students and guardians
    // For orgs (restrictNullRole=true): restrict if role is null (not owner/admin/teacher)
    const isRestricted = role === null 
        ? restrictNullRole 
        : isRestrictedRole(role);

    // If user is restricted, show access denied
    if (isRestricted) {
        const displayRole = role === null ? "member" : role;
        return (
            <AccessDenied
                role={displayRole}
                backUrl={backUrl}
                onNavigateBack={() => {
                    if (backUrl) {
                        navigate({ to: backUrl as any });
                    } else {
                        navigate({ to: ".." });
                    }
                }}
            />
        );
    }

    // User has access, render children
    return <>{children}</>;
}

interface AccessDeniedProps {
    role: string;
    backUrl?: string;
    onNavigateBack: () => void;
}

function AccessDenied({ role, onNavigateBack }: AccessDeniedProps) {
    const roleLabel = 
        role === "student" 
            ? "Students" 
            : role === "guardian"
              ? "Guardians"
              : role === "assistant-teacher"
                ? "Assistant Teachers"
                : "Members";

    return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-destructive/10">
                            <AlertTriangle className="size-8 text-destructive" />
                        </div>
                    </div>
                    <CardTitle>Access Restricted</CardTitle>
                    <CardDescription>
                        {roleLabel} do not have permission to view this page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Please contact the teacher if you believe you should have access to this page.
                    </p>
                    <Button onClick={onNavigateBack}>
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Hook to check if the current user can manage roles
 * Returns false for students and guardians
 */
export function useCanManageRoles(role: ClassRole | OrgRole | null): boolean {
    if (!role) return false;
    return !isRestrictedRole(role);
}
