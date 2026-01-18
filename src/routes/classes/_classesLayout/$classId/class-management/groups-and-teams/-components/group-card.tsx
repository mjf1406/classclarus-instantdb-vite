/** @format */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MoreVertical, Plus, Users, ChevronUp } from "lucide-react";
import { EditGroupDialog } from "./edit-group-dialog";
import { DeleteGroupDialog } from "./delete-group-dialog";
import { CreateTeamDialog } from "./create-team-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { TeamCard } from "./team-card";

interface GroupCardProps {
    group: InstaQLEntity<
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
    classId: string;
    canManage: boolean;
    highlightedStudentIds?: string[];
}

export function GroupCard({ group, classId, canManage, highlightedStudentIds = [] }: GroupCardProps) {
    const [isStudentsOpen, setIsStudentsOpen] = useState(true);
    const [isTeamsOpen, setIsTeamsOpen] = useState(true);
    const students = group.groupStudents || [];
    const teams = group.groupTeams || [];

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
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5 text-primary" />
                            {group.name}
                        </CardTitle>
                        {group.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {group.description}
                            </p>
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
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <EditGroupDialog
                                    group={group}
                                    classId={classId}
                                    asDropdownItem
                                >
                                    Edit
                                </EditGroupDialog>
                                <DeleteGroupDialog group={group} asDropdownItem>
                                    Delete
                                </DeleteGroupDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Students */}
                {students.length > 0 && (
                    <Collapsible open={isStudentsOpen} onOpenChange={setIsStudentsOpen}>
                        <div className="space-y-2">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between p-0 h-auto font-medium"
                                >
                                    <span className="text-sm">
                                        Students ({students.length})
                                    </span>
                                    <ChevronUp
                                        className={`size-4 transition-transform ${
                                            isStudentsOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {students.map((student) => {
                                        const isHighlighted = highlightedStudentIds.includes(student.id);
                                        return (
                                            <Badge
                                                key={student.id}
                                                variant={isHighlighted ? "default" : "secondary"}
                                                className={cn(
                                                    "flex items-center gap-1.5 pr-1.5",
                                                    isHighlighted && "ring-2 ring-primary/30 font-semibold"
                                                )}
                                            >
                                                <Avatar className="size-4">
                                                    <AvatarImage
                                                        src={
                                                            student.avatarURL ||
                                                            student.imageURL
                                                        }
                                                    />
                                                    <AvatarFallback className="text-xs">
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
                            </CollapsibleContent>
                        </div>
                    </Collapsible>
                )}

                {/* Teams */}
                <Collapsible open={isTeamsOpen} onOpenChange={setIsTeamsOpen}>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="p-0 h-auto font-medium"
                                >
                                    <span className="text-sm">
                                        Teams ({teams.length})
                                    </span>
                                    <ChevronUp
                                        className={`size-4 ml-2 transition-transform ${
                                            isTeamsOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                            {canManage && (
                                <CreateTeamDialog
                                    classId={classId}
                                    groupId={group.id}
                                >
                                    <Button variant="outline" size="sm">
                                        <Plus className="size-4 mr-1" />
                                        Create Team
                                    </Button>
                                </CreateTeamDialog>
                            )}
                        </div>
                        <CollapsibleContent>
                            {teams.length > 0 ? (
                                <div className="space-y-2 pt-2">
                                    {teams.map((team) => (
                                        <TeamCard
                                            key={team.id}
                                            team={team}
                                            group={group}
                                            canManage={canManage}
                                            highlightedStudentIds={highlightedStudentIds}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground pt-2">
                                    No teams yet. Create a team to organize students
                                    within this group.
                                </p>
                            )}
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
