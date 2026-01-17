/** @format */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { useParams } from "@tanstack/react-router";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    OwnerIcon,
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    GuardianIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import { RestrictedRoute } from "@/components/auth/restricted-route";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const owners = classEntity?.owner ? [classEntity.owner] : [];
    const admins = classEntity?.classAdmins || [];
    const teachers = classEntity?.classTeachers || [];
    const assistantTeachers = classEntity?.classAssistantTeachers || [];
    const students = classEntity?.classStudents || [];
    const guardians = classEntity?.classGuardians || [];

    const sections = [
        {
            id: "owners",
            title: "Owners",
            icon: OwnerIcon,
            count: owners.length,
            items: owners,
            isLoading: false,
            link: null,
        },
        {
            id: "admins",
            title: "Admins",
            icon: AdminIcon,
            count: admins.length,
            items: admins,
            isLoading: false,
            link: `/classes/${classId}/members/admins`,
        },
        {
            id: "teachers",
            title: "Teachers",
            icon: TeacherIcon,
            count: teachers.length,
            items: teachers,
            isLoading: false,
            link: `/classes/${classId}/members/teachers`,
        },
        {
            id: "assistant-teachers",
            title: "Assistant Teachers",
            icon: AssistantTeacherIcon,
            count: assistantTeachers.length,
            items: assistantTeachers,
            isLoading: false,
            link: `/classes/${classId}/members/assistant-teachers`,
        },
        {
            id: "students",
            title: "Students",
            icon: StudentIcon,
            count: students.length,
            items: students,
            isLoading: false,
            link: `/classes/${classId}/members/students`,
        },
        {
            id: "guardians",
            title: "Guardians",
            icon: GuardianIcon,
            count: guardians.length,
            items: guardians,
            isLoading: false,
            link: `/classes/${classId}/members/guardians`,
        },
    ];

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                All Members
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage all class members
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
                ) : (
                    <div className="space-y-4">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <Collapsible key={section.id} defaultOpen={section.id === "owners" || section.id === "admins" || section.id === "teachers"}>
                                    <Card>
                                        <CollapsibleTrigger className="w-full">
                                            <CardContent className="flex items-center justify-between py-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="size-5 text-primary" />
                                                    <span className="font-medium">
                                                        {section.title}
                                                    </span>
                                                    <Badge variant="secondary">
                                                        {section.count}
                                                    </Badge>
                                                </div>
                                                <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                            </CardContent>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <CardContent className="pt-0 pb-4">
                                                {section.isLoading ? (
                                                    <div className="space-y-3">
                                                        {Array.from({ length: 3 }).map(
                                                            (_, i) => (
                                                                <Skeleton
                                                                    key={i}
                                                                    className="h-16 w-full"
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                ) : section.items.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground py-4">
                                                        No {section.title.toLowerCase()}{" "}
                                                        found.
                                                    </p>
                                                ) : (
                                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                        {section.items.map((user: any) => {
                                                            const displayName =
                                                                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                                user.email ||
                                                                "Unknown User";
                                                            const initials = displayName
                                                                .split(" ")
                                                                .map((n: string) => n[0])
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2);

                                                            return (
                                                                <div
                                                                    key={user.id}
                                                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                                                                >
                                                                    <Avatar>
                                                                        <AvatarImage
                                                                            src={
                                                                                user.avatarURL ||
                                                                                user.imageURL
                                                                            }
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
                                                                                {
                                                                                    user.email
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {section.link && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <Link
                                                            to={section.link as any}
                                                            className="text-sm text-primary hover:underline"
                                                        >
                                                            View all {section.title.toLowerCase()}{" "}
                                                            →
                                                        </Link>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </CollapsibleContent>
                                    </Card>
                                </Collapsible>
                            );
                        })}
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
