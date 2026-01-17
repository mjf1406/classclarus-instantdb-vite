/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { TeacherIcon } from "@/components/icons/role-icons";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
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
import { RestrictedRoute } from "@/components/auth/restricted-route";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/teachers/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    
    if (!classId) {
        return null;
    }
    
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const teachers = classEntity?.classTeachers || [];
    const canManage = roleInfo.isOwner || roleInfo.isAdmin;

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TeacherIcon className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Teachers
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage teachers in your class
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
                ) : teachers.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                No teachers have been added to this class yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teachers.map((teacher) => {
                            const displayName =
                                `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
                                teacher.email ||
                                "Unknown User";
                            const initials = displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);

                            return (
                                <Card key={teacher.id}>
                                    <CardContent className="py-4 space-y-3">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage
                                                    src={teacher.avatarURL || teacher.imageURL}
                                                />
                                                <AvatarFallback>
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {displayName}
                                                </div>
                                                {teacher.email && (
                                                    <div className="text-sm text-muted-foreground truncate">
                                                        {teacher.email}
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
                                                            user={teacher}
                                                            contextType="class"
                                                            contextId={classId}
                                                            canKick={canManage}
                                                            asDropdownItem
                                                        />
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                        <RoleManager
                                            user={teacher}
                                            contextType="class"
                                            contextId={classId}
                                            canManage={canManage}
                                        />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
