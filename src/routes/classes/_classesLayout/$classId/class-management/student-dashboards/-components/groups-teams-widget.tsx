/** @format */

import { Users, Users2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { Skeleton } from "@/components/ui/skeleton";
import type { GroupsTeamsDisplayOption } from "./groups-teams-widget-config";
import { cn } from "@/lib/utils";

type Group = InstaQLEntity<
    AppSchema,
    "groups",
    {
        class: {};
        groupStudents: {};
        groupTeams: {
            teamStudents: {};
        };
    }
>;

interface GroupsTeamsWidgetProps {
    classId: string;
    studentId: string;
    displayOption: GroupsTeamsDisplayOption;
}

export function GroupsTeamsWidget({
    classId,
    studentId,
    displayOption,
}: GroupsTeamsWidgetProps) {
    // Don't render if display option is "none"
    if (displayOption === "none") {
        return null;
    }

    // Query groups with students and teams
    const { data: groupsData, isLoading: groupsLoading } = db.useQuery(
        classId
            ? {
                  groups: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                      groupStudents: {},
                      groupTeams: {
                          teamStudents: {},
                      },
                  },
              }
            : null
    );

    const groups = (groupsData as { groups?: Group[] } | undefined)?.groups || [];

    if (groupsLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="size-5 text-primary" />
                        <CardTitle>Groups & Teams</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    const hasGroups = groups.length > 0;

    if (!hasGroups) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="size-5 text-primary" />
                        <CardTitle>Groups & Teams</CardTitle>
                    </div>
                    <CardDescription>
                        {displayOption === "groups"
                            ? "No groups have been created yet"
                            : "No groups or teams have been created yet"}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const getStudentDisplayName = (student: InstaQLEntity<AppSchema, "$users">) => {
        const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();
        return name || student.email || "Unknown";
    };

    const getStudentInitials = (student: InstaQLEntity<AppSchema, "$users">) => {
        const name = getStudentDisplayName(student);
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    <CardTitle>Groups & Teams</CardTitle>
                </div>
                <CardDescription>
                    {displayOption === "groups"
                        ? "All groups in this class"
                        : "All groups and teams in this class"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Groups Section */}
                {hasGroups && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Groups</h3>
                        </div>
                        <div className="space-y-2">
                            {groups.map((group) => {
                                const groupStudents = group.groupStudents || [];
                                const studentCount = groupStudents.length;

                                return (
                                    <div
                                        key={group.id}
                                        className="rounded-lg border p-4 space-y-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-medium">{group.name}</h4>
                                                {group.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {group.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="secondary">
                                                {studentCount} {studentCount === 1 ? "member" : "members"}
                                            </Badge>
                                        </div>

                                        {/* Group Members */}
                                        {groupStudents.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Group Members
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {groupStudents.map((student) => {
                                                        const displayName = getStudentDisplayName(student);
                                                        const initials = getStudentInitials(student);
                                                        const isCurrentStudent = student.id === studentId;

                                                        return (
                                                            <div
                                                                key={student.id}
                                                                className={cn(
                                                                    "flex items-center gap-2 rounded-md px-2 py-1",
                                                                    isCurrentStudent && "bg-primary/10 ring-2 ring-primary/20"
                                                                )}
                                                            >
                                                                <Avatar className="size-8">
                                                                    <AvatarImage
                                                                        src={student.avatarURL || student.imageURL}
                                                                    />
                                                                    <AvatarFallback className="text-xs">
                                                                        {initials}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className={cn(
                                                                    "text-sm font-medium",
                                                                    isCurrentStudent && "text-primary font-semibold"
                                                                )}>
                                                                    {displayName.split(" ")[0]}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Teams within this group (only if displayOption is groups-and-teams) */}
                                        {displayOption === "groups-and-teams" &&
                                            group.groupTeams &&
                                            group.groupTeams.length > 0 && (
                                                <div className="space-y-2 pt-2 border-t">
                                                    <div className="flex items-center gap-2">
                                                        <Users2 className="size-4 text-muted-foreground" />
                                                        <p className="text-xs font-medium text-muted-foreground">
                                                            Teams in this group
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {group.groupTeams.map((team) => {
                                                            const teamStudents = team.teamStudents || [];
                                                            const isStudentInTeam = teamStudents.some((s) => s.id === studentId);

                                                            return (
                                                                <div
                                                                    key={team.id}
                                                                    className={cn(
                                                                        "rounded-lg border-l-4 border-l-primary/50 p-3 space-y-2",
                                                                        isStudentInTeam && "bg-primary/5"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Users2 className="size-3 text-primary" />
                                                                        <span className="font-medium text-sm">{team.name}</span>
                                                                        {team.description && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {team.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {teamStudents.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {teamStudents.map((student) => {
                                                                                const displayName = getStudentDisplayName(student);
                                                                                const initials = getStudentInitials(student);
                                                                                const isCurrentStudent = student.id === studentId;

                                                                                return (
                                                                                    <Badge
                                                                                        key={student.id}
                                                                                        variant="outline"
                                                                                        className={cn(
                                                                                            "flex items-center gap-1 pr-1 text-xs",
                                                                                            isCurrentStudent && "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                                                                        )}
                                                                                    >
                                                                                        <Avatar className="size-3">
                                                                                            <AvatarImage
                                                                                                src={student.avatarURL || student.imageURL}
                                                                                            />
                                                                                            <AvatarFallback className="text-[8px]">
                                                                                                {initials}
                                                                                            </AvatarFallback>
                                                                                        </Avatar>
                                                                                        <span className={cn(
                                                                                            isCurrentStudent && "font-semibold text-primary"
                                                                                        )}>
                                                                                            {displayName}
                                                                                        </span>
                                                                                    </Badge>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                    {teamStudents.length === 0 && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            No students assigned
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
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
