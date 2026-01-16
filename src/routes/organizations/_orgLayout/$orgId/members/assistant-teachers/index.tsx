/** @format */

import { createFileRoute, Link } from "@tanstack/react-router";
import { AssistantTeacherIcon } from "@/components/icons/role-icons";
import { useOrgClassRoleMembers } from "@/hooks/use-org-class-role-members";
import { useParams } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/assistant-teachers/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const orgId = params.orgId;
    const { users, isLoading } = useOrgClassRoleMembers(
        orgId,
        "classAssistantTeachers"
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AssistantTeacherIcon className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Assistant Teachers
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            View assistant teachers in classes within this organization
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
            ) : users.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No assistant teachers found in any classes within this organization.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {users.map(({ user, classes }) => {
                        const displayName =
                            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                            user.email ||
                            "Unknown User";
                        const initials = displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                        return (
                            <Card key={user.id}>
                                <CardContent className="py-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage
                                                    src={user.avatarURL || user.imageURL}
                                                />
                                                <AvatarFallback>
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {displayName}
                                                </div>
                                                {user.email && (
                                                    <div className="text-sm text-muted-foreground truncate">
                                                        {user.email}
                                                    </div>
                                                )}
                                            </div>
                                            <Badge variant="secondary">
                                                {classes.length}{" "}
                                                {classes.length === 1
                                                    ? "class"
                                                    : "classes"}
                                            </Badge>
                                        </div>
                                        {classes.length > 0 && (
                                            <div className="ml-14 space-y-1">
                                                <div className="text-sm font-medium mb-2">
                                                    Classes:
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {classes.map((cls) => (
                                                        <Link
                                                            key={cls.id}
                                                            to="/organizations/$orgId/main/classes/$classId"
                                                            params={{
                                                                orgId: orgId!,
                                                                classId: cls.id,
                                                            }}
                                                        >
                                                            <Badge
                                                                variant="outline"
                                                                className="cursor-pointer hover:bg-muted"
                                                            >
                                                                {cls.name}
                                                            </Badge>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
