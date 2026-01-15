/** @format */

import { Link } from "@tanstack/react-router";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
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
import type { ClassWithRelations } from "@/hooks/use-class-hooks";

interface ClassCardProps {
    classEntity: ClassWithRelations;
}

export function ClassCard({ classEntity }: ClassCardProps) {
    const studentCount = classEntity.classStudents?.length || 0;
    const teacherCount = classEntity.classTeachers?.length || 0;
    const assistantTeacherCount =
        classEntity.classAssistantTeachers?.length || 0;
    const parentCount = classEntity.classParents?.length || 0;
    const description = classEntity.description || "No description";

    // Determine user's role in the class
    const roleInfo = useClassRole(classEntity);

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
        <Card className="group/card hover:ring-foreground/20 transition-all h-full">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Link
                            to="/classes/$classId"
                            params={{ classId: classEntity.id }}
                            className="shrink-0"
                        >
                            <OrgIconDisplay
                                icon={classEntity.icon}
                                size="md"
                                className="hover:opacity-80 transition-opacity"
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="line-clamp-1 flex items-center gap-2">
                                <Link
                                    to="/classes/$classId"
                                    params={{ classId: classEntity.id }}
                                    className="hover:underline"
                                >
                                    {classEntity.name}
                                </Link>
                                {RoleBadge && <RoleBadge />}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                                {description}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
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
