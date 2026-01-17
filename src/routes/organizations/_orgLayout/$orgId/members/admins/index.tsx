/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { AdminIcon } from "@/components/icons/role-icons";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgRole } from "@/hooks/use-org-role";
import { useParams } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleManager } from "@/components/members/role-manager";
import { KickUserDialog } from "@/components/members/kick-user-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/admins/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const orgId = params.orgId;
    
    if (!orgId) {
        return null;
    }
    
    const { organization, isLoading } = useOrganizationById(orgId);
    const roleInfo = useOrgRole(organization);

    const admins = organization?.admins || [];
    const canManage = roleInfo.isOwner || roleInfo.isAdmin;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AdminIcon className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Admins
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Manage administrators in your organization
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            ) : admins.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No admins have been added to this organization yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {admins.map((admin) => {
                        const displayName =
                            `${admin.firstName || ""} ${admin.lastName || ""}`.trim() ||
                            admin.email ||
                            "Unknown User";
                        const initials = displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                        return (
                            <Card key={admin.id}>
                                <CardContent className="py-4 space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage
                                                src={admin.avatarURL || admin.imageURL}
                                            />
                                            <AvatarFallback>
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">
                                                {displayName}
                                            </div>
                                            {admin.email && (
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {admin.email}
                                                </div>
                                            )}
                                        </div>
                                        {canManage && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreVertical className="size-4" />
                                                        <span className="sr-only">
                                                            More options
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <KickUserDialog
                                                        user={admin}
                                                        contextType="org"
                                                        contextId={orgId}
                                                        canKick={canManage}
                                                        asDropdownItem
                                                    />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                    <RoleManager
                                        user={admin}
                                        contextType="org"
                                        contextId={orgId}
                                        canManage={canManage}
                                    />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
