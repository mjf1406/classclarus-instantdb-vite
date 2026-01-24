/** @format */

import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ClassRoleInfo } from "@/hooks/use-class-role";

type ClassQueryResult = {
    classes: Array<{
        classTeachers: Array<InstaQLEntity<AppSchema, "$users">>;
        classAssistantTeachers: Array<InstaQLEntity<AppSchema, "$users">>;
    }>;
};

interface TeachersCardProps {
    classId: string;
    roleInfo: ClassRoleInfo;
}

export function TeachersCard({ classId, roleInfo }: TeachersCardProps) {
    const { data, isLoading } = db.useQuery(
        classId
            ? {
                  classes: {
                      $: { where: { id: classId } },
                      classTeachers: {},
                      classAssistantTeachers: {},
                  },
              }
            : null
    );

    const typedData = (data as ClassQueryResult | undefined) ?? null;
    const classData = typedData?.classes?.[0];
    const teachers = classData?.classTeachers || [];
    const assistantTeachers = classData?.classAssistantTeachers || [];

    // Determine which display name field to use based on viewer role
    const isStudent = roleInfo.isStudent;
    const getDisplayName = (teacher: InstaQLEntity<AppSchema, "$users">) => {
        if (isStudent) {
            return (
                teacher.displayNameForStudents ||
                `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
                teacher.email ||
                "Unknown User"
            );
        } else {
            // For guardians/parents
            return (
                teacher.displayNameForParents ||
                `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
                teacher.email ||
                "Unknown User"
            );
        }
    };

    const getInitials = (displayName: string) => {
        return displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Teachers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const hasTeachers = teachers.length > 0;
    const hasAssistantTeachers = assistantTeachers.length > 0;

    if (!hasTeachers && !hasAssistantTeachers) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Teachers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="py-8 text-center">
                        <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                            No teachers have been added to this class yet.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Teachers
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {hasTeachers && (
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                            Teachers
                        </h3>
                        <div className="space-y-3">
                            {teachers.map((teacher) => {
                                const displayName = getDisplayName(teacher);
                                const initials = getInitials(displayName);

                                return (
                                    <div
                                        key={teacher.id}
                                        className="flex items-center gap-4"
                                    >
                                        <Avatar>
                                            <AvatarImage
                                                src={
                                                    teacher.avatarURL ||
                                                    teacher.imageURL
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
                                            {teacher.email && (
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {teacher.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {hasAssistantTeachers && (
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                            Assistant Teachers
                        </h3>
                        <div className="space-y-3">
                            {assistantTeachers.map((assistantTeacher) => {
                                const displayName = getDisplayName(
                                    assistantTeacher
                                );
                                const initials = getInitials(displayName);

                                return (
                                    <div
                                        key={assistantTeacher.id}
                                        className="flex items-center gap-4"
                                    >
                                        <Avatar>
                                            <AvatarImage
                                                src={
                                                    assistantTeacher.avatarURL ||
                                                    assistantTeacher.imageURL
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
                                            {assistantTeacher.email && (
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {assistantTeacher.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
