/** @format */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
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
    ParentIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import { useOrgClassRoleMembers } from "@/hooks/use-org-class-role-members";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const orgId = params.orgId;
    const { organization } = useOrganizationById(orgId);

    const { users: students, isLoading: studentsLoading } =
        useOrgClassRoleMembers(orgId, "classStudents");
    const { users: assistantTeachers, isLoading: assistantTeachersLoading } =
        useOrgClassRoleMembers(orgId, "classAssistantTeachers");
    const { users: parents, isLoading: parentsLoading } = useOrgClassRoleMembers(
        orgId,
        "classParents"
    );

    const owners = organization?.owner ? [organization.owner] : [];
    const admins = organization?.admins || [];
    const teachers = organization?.orgTeachers || [];

    const sections = [
        {
            id: "owners",
            title: "Owners",
            icon: OwnerIcon,
            count: owners.length,
            items: owners,
            isLoading: false,
            isOrgLevel: true,
            link: null,
        },
        {
            id: "admins",
            title: "Admins",
            icon: AdminIcon,
            count: admins.length,
            items: admins,
            isLoading: false,
            isOrgLevel: true,
            link: `/organizations/${orgId}/members/admins`,
        },
        {
            id: "teachers",
            title: "Teachers",
            icon: TeacherIcon,
            count: teachers.length,
            items: teachers,
            isLoading: false,
            isOrgLevel: true,
            link: `/organizations/${orgId}/members/teachers`,
        },
        {
            id: "assistant-teachers",
            title: "Assistant Teachers",
            icon: AssistantTeacherIcon,
            count: assistantTeachers.length,
            items: assistantTeachers,
            isLoading: assistantTeachersLoading,
            isOrgLevel: false,
            link: `/organizations/${orgId}/members/assistant-teachers`,
        },
        {
            id: "parents",
            title: "Parents",
            icon: ParentIcon,
            count: parents.length,
            items: parents,
            isLoading: parentsLoading,
            isOrgLevel: false,
            link: `/organizations/${orgId}/members/parents`,
        },
        {
            id: "students",
            title: "Students",
            icon: StudentIcon,
            count: students.length,
            items: students,
            isLoading: studentsLoading,
            isOrgLevel: false,
            link: `/organizations/${orgId}/members/students`,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            All Members
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            View and manage all organization members
                        </p>
                    </div>
                </div>
            </div>

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
                                        ) : section.isOrgLevel ? (
                                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                {section.items.map((item: any) => {
                                                    const user = item;
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
                                        ) : (
                                            <div className="space-y-2">
                                                {section.items.map(
                                                    ({
                                                        user,
                                                        classes,
                                                    }: any) => {
                                                        const displayName =
                                                            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                            user.email ||
                                                            "Unknown User";
                                                        const initials =
                                                            displayName
                                                                .split(" ")
                                                                .map(
                                                                    (
                                                                        n: string
                                                                    ) => n[0]
                                                                )
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2);

                                                        return (
                                                            <Collapsible
                                                                key={user.id}
                                                            >
                                                                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
                                                                    <Avatar>
                                                                        <AvatarImage
                                                                            src={
                                                                                user.avatarURL ||
                                                                                user.imageURL
                                                                            }
                                                                        />
                                                                        <AvatarFallback>
                                                                            {
                                                                                initials
                                                                            }
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium truncate">
                                                                            {
                                                                                displayName
                                                                            }
                                                                        </div>
                                                                        {user.email && (
                                                                            <div className="text-sm text-muted-foreground truncate">
                                                                                {
                                                                                    user.email
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Badge
                                                                        variant="secondary"
                                                                    >
                                                                        {
                                                                            classes.length
                                                                        }{" "}
                                                                        {classes.length ===
                                                                        1
                                                                            ? "class"
                                                                            : "classes"}
                                                                    </Badge>
                                                                    <CollapsibleTrigger>
                                                                        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                                    </CollapsibleTrigger>
                                                                </div>
                                                                <CollapsibleContent>
                                                                    <div className="ml-14 space-y-1 pb-2">
                                                                        {classes.map(
                                                                            (
                                                                                cls: {
                                                                                    id: string;
                                                                                    name: string;
                                                                                }
                                                                            ) => (
                                                                                <Link
                                                                                    key={
                                                                                        cls.id
                                                                                    }
                                                                                    to="/classes/$classId"
                                                                                    params={{
                                                                                        classId:
                                                                                            cls.id,
                                                                                    }}
                                                                                    className="block p-2 rounded-md hover:bg-muted/50 transition-colors text-sm"
                                                                                >
                                                                                    {
                                                                                        cls.name
                                                                                    }
                                                                                </Link>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        )}
                                        {section.link && (
                                            <div className="mt-4 pt-4 border-t">
                                                <Link
                                                    to={section.link}
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
        </div>
    );
}
