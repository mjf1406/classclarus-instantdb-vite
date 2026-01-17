/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { UserPlus, Check } from "lucide-react";
import { useState } from "react";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgJoinCode } from "@/hooks/use-org-join-code";
import { useOrgRole } from "@/hooks/use-org-role";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { RestrictedRoute } from "@/components/auth/restricted-route";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/invite/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const orgId = params.orgId;
    const { organization, isLoading: orgLoading } = useOrganizationById(orgId);
    const { code, isLoading: codeLoading } = useOrgJoinCode(orgId);
    const roleInfo = useOrgRole(organization);

    const [copySuccess, setCopySuccess] = useState(false);

    const isLoading = orgLoading || codeLoading;
    const hasPermission = roleInfo.isOwner || roleInfo.isAdmin;

    const handleCopySuccess = () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            restrictNullRole
            backUrl={orgId ? `/organizations/${orgId}` : "/organizations"}
        >
            {!hasPermission ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserPlus className="size-12 md:size-16 text-primary" />
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                    Invite Members
                                </h1>
                                <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                    Invite new members to your organization
                                </p>
                            </div>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="py-6">
                            <p className="text-sm text-muted-foreground text-center">
                                You don't have permission to invite members. Only
                                organization owners and admins can manage join codes.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserPlus className="size-12 md:size-16 text-primary" />
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                    Invite Members
                                </h1>
                                <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                    Share the join code to invite teachers and admins to
                                    your organization
                                </p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Join Code</CardTitle>
                                <CardDescription>
                                    Share this code with users you want to invite. They
                                    can enter it on the join page to become a teacher in
                                    this organization.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {code ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className="text-2xl font-mono px-4 py-2 tracking-wider"
                                            >
                                                {code}
                                            </Badge>
                                            <CopyButton
                                                textToCopy={code}
                                                onCopySuccess={handleCopySuccess}
                                                variant="outline"
                                                size="default"
                                            >
                                                {copySuccess ? (
                                                    <>
                                                        <Check className="size-4" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    "Copy"
                                                )}
                                            </CopyButton>
                                        </div>

                                        <div className="pt-4 border-t space-y-2">
                                            <h3 className="text-sm font-medium">
                                                How to share:
                                            </h3>
                                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                                <li>
                                                    Copy the code above and share it with users
                                                    you want to invite
                                                </li>
                                                <li>
                                                    Users can go to the{" "}
                                                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                                                        /join
                                                    </code>{" "}
                                                    page and enter this code
                                                </li>
                                                <li>
                                                    After joining, users will be added as
                                                    teachers in this organization
                                                </li>
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Join code is being generated...
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </RestrictedRoute>
    );
}
