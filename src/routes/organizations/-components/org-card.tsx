/** @format */

import { Link } from "@tanstack/react-router";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2Icon } from "lucide-react";
import { OrgActionsMenu } from "./org-actions-menu";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
    OwnerIcon,
    AdminIcon,
    TeacherIcon,
    StudentIcon,
    ParentIcon,
} from "@/components/icons/role-icons";

type Organization = InstaQLEntity<
    AppSchema,
    "organizations",
    {
        classes: {};
        owner: {};
        admins: {};
        orgTeachers: {};
        orgStudents: {};
        orgParents: {};
    }
>;

interface OrgCardProps {
    organization: Organization;
}

export function OrgCard({ organization }: OrgCardProps) {
    const { user } = useAuthContext();
    const classCount = organization.classes?.length || 0;
    const icon = organization.icon || "🏢";
    const description = organization.description || "No description";

    // Determine user's role in the organization (priority: Owner > Admin > Teacher > Student > Parent)
    const userId = user?.id;
    const isOwner = userId && organization.owner?.id === userId;
    const isAdmin =
        userId &&
        !isOwner &&
        organization.admins?.some((admin) => admin.id === userId);
    const isTeacher =
        userId &&
        !isOwner &&
        !isAdmin &&
        organization.orgTeachers?.some((teacher) => teacher.id === userId);
    const isStudent =
        userId &&
        !isOwner &&
        !isAdmin &&
        !isTeacher &&
        organization.orgStudents?.some((student) => student.id === userId);
    const isParent =
        userId &&
        !isOwner &&
        !isAdmin &&
        !isTeacher &&
        !isStudent &&
        organization.orgParents?.some((parent) => parent.id === userId);

    // Get the appropriate role icon
    const RoleIcon = isOwner
        ? OwnerIcon
        : isAdmin
          ? AdminIcon
          : isTeacher
            ? TeacherIcon
            : isStudent
              ? StudentIcon
              : isParent
                ? ParentIcon
                : null;

    return (
        <Card className="group/card hover:ring-foreground/20 transition-all">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                            className="text-3xl shrink-0"
                            aria-hidden="true"
                        >
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="line-clamp-1">
                                <Link
                                    to="/organizations/$orgId"
                                    params={{ orgId: organization.id }}
                                    className="hover:underline"
                                >
                                    {organization.name}
                                </Link>
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                                {description}
                            </CardDescription>
                        </div>
                    </div>
                    <CardAction>
                        <OrgActionsMenu organization={organization} />
                    </CardAction>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    {RoleIcon && (
                        <Badge
                            variant="outline"
                            className="gap-1"
                        >
                            <RoleIcon className="size-3" />
                            {isOwner
                                ? "Owner"
                                : isAdmin
                                  ? "Admin"
                                  : isTeacher
                                    ? "Teacher"
                                    : isStudent
                                      ? "Student"
                                      : "Parent"}
                        </Badge>
                    )}
                    <Badge
                        variant="secondary"
                        className="gap-1"
                    >
                        <Building2Icon className="size-3" />
                        {classCount} {classCount === 1 ? "class" : "classes"}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
