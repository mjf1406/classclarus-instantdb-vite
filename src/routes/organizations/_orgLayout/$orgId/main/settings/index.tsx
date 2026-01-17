/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { UnderConstruction } from "@/components/under-construction";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgRole } from "@/hooks/use-org-role";
import { RestrictedRoute } from "@/components/auth/restricted-route";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/main/settings/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const orgId = params.orgId;
    const { organization, isLoading } = useOrganizationById(orgId);
    const roleInfo = useOrgRole(organization);

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            restrictNullRole
            backUrl={orgId ? `/organizations/${orgId}` : "/organizations"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Organization Settings
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Manage organization settings
                            </p>
                        </div>
                    </div>
                </div>
                <div className="h-[calc(100vh-12rem)]">
                    <UnderConstruction />
                </div>
            </div>
        </RestrictedRoute>
    );
}
