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
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2Icon, CalendarPlus, RefreshCw } from "lucide-react";
import { OrgActionsMenu } from "./org-actions-menu";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
    OwnerBadge,
    AdminBadge,
    TeacherBadge,
    StudentBadge,
    ParentBadge,
} from "@/components/icons/role-icons";
import { OrgIconDisplay } from "@/components/ui/org-icon-selector";
import { format, formatDistanceToNow } from "date-fns";

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

    // Get the appropriate role badge
    const RoleBadge = isOwner
        ? OwnerBadge
        : isAdmin
          ? AdminBadge
          : isTeacher
            ? TeacherBadge
            : isStudent
              ? StudentBadge
              : isParent
                ? ParentBadge
                : null;

    return (
        <Card className="group/card hover:ring-foreground/20 transition-all h-full">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <OrgIconDisplay
                            icon={organization.icon}
                            size="md"
                            className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <CardTitle className="line-clamp-1 flex items-center gap-2">
                                <Link
                                    to="/organizations/$orgId"
                                    params={{ orgId: organization.id }}
                                    className="hover:underline"
                                >
                                    {organization.name}
                                </Link>
                                {RoleBadge && <RoleBadge />}
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
            <CardContent className="flex-1">
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="gap-1"
                    >
                        <Building2Icon className="size-3" />
                        {classCount} {classCount === 1 ? "class" : "classes"}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <CalendarPlus className="size-3" />
                    {organization.created
                        ? format(
                              new Date(organization.created),
                              "MMM d, yyyy 'at' h:mm a"
                          )
                        : "N/A"}
                </span>
                <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3" />
                    {organization.updated
                        ? formatDistanceToNow(new Date(organization.updated), {
                              addSuffix: true,
                          })
                        : "N/A"}
                </span>
            </CardFooter>
        </Card>
    );
}
