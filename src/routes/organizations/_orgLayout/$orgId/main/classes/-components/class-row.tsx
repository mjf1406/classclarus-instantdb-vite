/** @format */

import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, RefreshCw } from "lucide-react";
import {
    OwnerBadge,
    AdminBadge,
    TeacherBadge,
    AssistantTeacherBadge,
    StudentBadge,
    ParentBadge,
    StudentIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    ParentIcon,
} from "@/components/icons/role-icons";
import { OrgIconDisplay } from "@/components/ui/org-icon-selector";
import { format, formatDistanceToNow } from "date-fns";
import { useClassRole } from "./use-class-role";
import type { ClassByRole } from "@/hooks/use-class-hooks";
import { ClassActionsMenu } from "./class-actions-menu";
import { ArchivedClassActionsMenu } from "./archived-class-actions-menu";
import { ArchiveIcon } from "lucide-react";

interface ClassRowProps {
    classEntity: ClassByRole;
    archived?: boolean;
}

export function ClassRow({ classEntity, archived = false }: ClassRowProps) {
    const studentCount = classEntity.classStudents?.length || 0;
    const teacherCount = classEntity.classTeachers?.length || 0;
    const assistantTeacherCount =
        classEntity.classAssistantTeachers?.length || 0;
    const parentCount = classEntity.classParents?.length || 0;
    const description = classEntity.description || "No description";

    // Determine user's role in the class
    const roleInfo = useClassRole(classEntity);
    
    // Determine if class is archived based on archivedAt field
    const isArchived = archived || !!classEntity.archivedAt;

    // Get the appropriate role badge
    const RoleBadge = roleInfo.isOwner
        ? OwnerBadge
        : roleInfo.isAdmin
          ? AdminBadge
          : roleInfo.isTeacher
            ? TeacherBadge
            : roleInfo.isAssistantTeacher
              ? AssistantTeacherBadge
              : roleInfo.isStudent
                ? StudentBadge
                : roleInfo.isParent
                  ? ParentBadge
                  : null;

    return (
        <Card className={`group/card hover:ring-foreground/20 transition-all ${isArchived ? "opacity-60" : ""}`}>
            <CardContent className="py-3">
                <div className="flex items-center gap-4">
                    <Link
                        to="/classes/$classId"
                        params={{ classId: classEntity.id }}
                        className="shrink-0"
                    >
                        <OrgIconDisplay
                            icon={classEntity.icon}
                            size="sm"
                            className="hover:opacity-80 transition-opacity"
                        />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Link
                                to="/classes/$classId"
                                params={{ classId: classEntity.id }}
                                className="font-medium hover:underline line-clamp-1"
                            >
                                {classEntity.name}
                            </Link>
                            {RoleBadge && <RoleBadge />}
                            {isArchived && (
                                <Badge variant="secondary" className="gap-1">
                                    <ArchiveIcon className="size-3" />
                                    Archived
                                </Badge>
                            )}
                            <Badge
                                variant="secondary"
                                className="gap-1"
                            >
                                <StudentIcon className="size-3" />
                                {studentCount}{" "}
                                {studentCount === 1 ? "student" : "students"}
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="gap-1"
                            >
                                <TeacherIcon className="size-3" />
                                {teacherCount}{" "}
                                {teacherCount === 1 ? "teacher" : "teachers"}
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="gap-1"
                            >
                                <AssistantTeacherIcon className="size-3" />
                                {assistantTeacherCount}{" "}
                                {assistantTeacherCount === 1
                                    ? "asst teacher"
                                    : "asst teachers"}
                            </Badge>
                            <Badge
                                variant="secondary"
                                className="gap-1"
                            >
                                <ParentIcon className="size-3" />
                                {parentCount}{" "}
                                {parentCount === 1 ? "parent" : "parents"}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {description}
                        </p>
                    </div>
                    <div className="shrink-0">
                        {isArchived ? (
                            <ArchivedClassActionsMenu classEntity={classEntity} />
                        ) : (
                            <ClassActionsMenu classEntity={classEntity} />
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <CalendarPlus className="size-3" />
                    {classEntity.created
                        ? format(
                              new Date(classEntity.created),
                              "MMM d, yyyy 'at' h:mm a"
                          )
                        : "N/A"}
                </span>
                <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3" />
                    {classEntity.updated
                        ? formatDistanceToNow(new Date(classEntity.updated), {
                              addSuffix: true,
                          })
                        : "N/A"}
                </span>
            </CardFooter>
        </Card>
    );
}
