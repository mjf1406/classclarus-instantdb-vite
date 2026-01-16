/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { AdminIcon } from "@/components/icons/role-icons";
import { useClassById } from "@/hooks/use-class-hooks";
import { useParams } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/admins/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);

    const admins = classEntity?.classAdmins || [];

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
                            Manage administrators in your class
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
                            No admins have been added to this class yet.
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
                                <CardContent className="py-4">
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
