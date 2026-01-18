/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Users2 } from "lucide-react";
import { EditTeamDialog } from "./edit-team-dialog";
import { DeleteTeamDialog } from "./delete-team-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Group = InstaQLEntity<
    AppSchema,
    "groups",
    {
        groupStudents: {};
        groupTeams: { teamStudents: {} };
    }
>;

interface TeamCardProps {
    team: InstaQLEntity<
        AppSchema,
        "teams",
        {
            teamStudents: {};
        }
    >;
    group: Group;
    canManage: boolean;
    highlightedStudentIds?: string[];
}

export function TeamCard({ team, group, canManage, highlightedStudentIds = [] }: TeamCardProps) {
    const students = team.teamStudents || [];

    const getStudentDisplayName = (student: InstaQLEntity<AppSchema, "$users">) => {
        const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();
        return name || student.email || "Unknown Student";
    };

    const getStudentInitials = (student: InstaQLEntity<AppSchema, "$users">) => {
        const name = getStudentDisplayName(student);
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Card className="border-l-4 border-l-primary/50">
            <CardContent className="py-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Users2 className="size-4 text-primary" />
                            <span className="font-medium">{team.name}</span>
                        </div>
                        {team.description && (
                            <p className="text-xs text-muted-foreground">
                                {team.description}
                            </p>
                        )}
                        {students.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {students.map((student) => {
                                    const isHighlighted = highlightedStudentIds.includes(student.id);
                                    return (
                                        <Badge
                                            key={student.id}
                                            variant={isHighlighted ? "default" : "outline"}
                                            className={cn(
                                                "flex items-center gap-1 pr-1 text-xs",
                                                isHighlighted && "ring-2 ring-primary/30 font-semibold"
                                            )}
                                        >
                                            <Avatar className="size-3">
                                                <AvatarImage
                                                    src={
                                                        student.avatarURL ||
                                                        student.imageURL
                                                    }
                                                />
                                                <AvatarFallback className="text-[8px]">
                                                    {getStudentInitials(student)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className={cn(
                                                "text-xs",
                                                isHighlighted && "font-semibold"
                                            )}>
                                                {getStudentDisplayName(student)}
                                            </span>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                        {students.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No students assigned
                            </p>
                        )}
                    </div>
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                >
                                    <MoreVertical className="size-3" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <EditTeamDialog team={team} group={group} asDropdownItem>
                                    Edit
                                </EditTeamDialog>
                                <DeleteTeamDialog team={team} asDropdownItem>
                                    Delete
                                </DeleteTeamDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
