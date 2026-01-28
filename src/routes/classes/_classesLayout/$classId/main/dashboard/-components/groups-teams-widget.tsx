/** @format */

import { useMemo } from "react";
import { Users } from "lucide-react";
import { format } from "date-fns";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface GroupsTeamsWidgetProps {
    classId: string;
    studentId: string;
}

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

type GroupsQueryResult = {
    groups: Group[];
};

type GroupMembershipHistory = InstaQLEntity<
    AppSchema,
    "group_membership_history",
    {
        student: {};
        group: {};
    }
>;

type TeamMembershipHistory = InstaQLEntity<
    AppSchema,
    "team_membership_history",
    {
        student: {};
        team: {};
    }
>;

type GroupMembershipHistoryQueryResult = {
    group_membership_history: GroupMembershipHistory[];
};

type TeamMembershipHistoryQueryResult = {
    team_membership_history: TeamMembershipHistory[];
};

interface StudentGroupTeam {
    groupId: string;
    groupName: string;
    groupJoinedAt: Date | string | number | null;
    teamIds: string[];
    teamNames: string[];
    teamJoinedAts: (Date | string | number | null)[];
}

export function GroupsTeamsWidget({ classId, studentId }: GroupsTeamsWidgetProps) {
    // Query all groups for this class with their students and teams
    const { data: groupsData } = db.useQuery(
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

    // Query membership history for groups
    const { data: groupHistoryData } = db.useQuery(
        classId && studentId
            ? {
                  group_membership_history: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": studentId },
                              ],
                          },
                      },
                      student: {},
                      group: {},
                  },
              }
            : null
    );

    // Query membership history for teams
    const { data: teamHistoryData } = db.useQuery(
        classId && studentId
            ? {
                  team_membership_history: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "student.id": studentId },
                              ],
                          },
                      },
                      student: {},
                      team: {},
                  },
              }
            : null
    );

    const typedGroupsData = (groupsData as GroupsQueryResult | undefined) ?? null;
    const groups = typedGroupsData?.groups || [];

    const typedGroupHistoryData = (groupHistoryData as GroupMembershipHistoryQueryResult | undefined) ?? null;
    const groupHistory = typedGroupHistoryData?.group_membership_history || [];

    const typedTeamHistoryData = (teamHistoryData as TeamMembershipHistoryQueryResult | undefined) ?? null;
    const teamHistory = typedTeamHistoryData?.team_membership_history || [];

    // Create combined history timeline
    const historyTimeline = useMemo(() => {
        const timeline: Array<{
            id: string;
            type: "group" | "team";
            name: string;
            action: "added" | "removed";
            date: Date | string | number;
        }> = [];

        // Add group history events
        for (const history of groupHistory) {
            if (history.group?.id && history.group?.name) {
                timeline.push({
                    id: history.id,
                    type: "group",
                    name: history.group.name,
                    action: (history.action as "added" | "removed") || "added",
                    date: history.addedAt,
                });
            }
        }

        // Add team history events
        for (const history of teamHistory) {
            if (history.team?.id && history.team?.name) {
                timeline.push({
                    id: history.id,
                    type: "team",
                    name: history.team.name,
                    action: (history.action as "added" | "removed") || "added",
                    date: history.addedAt,
                });
            }
        }

        // Sort by date descending (most recent first)
        return timeline.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
    }, [groupHistory, teamHistory]);

    // Filter groups and teams where the student is a member
    const studentGroupsTeams = useMemo(() => {
        const result: StudentGroupTeam[] = [];

        // Create maps for quick lookup of join dates (only use "added" events)
        // Use the most recent "added" event for each group/team
        const groupJoinDateMap = new Map<string, Date | string | number | null>();
        for (const history of groupHistory) {
            if (history.group?.id && history.action === "added") {
                const existing = groupJoinDateMap.get(history.group.id);
                // Keep the most recent "added" date
                if (!existing || new Date(history.addedAt) > new Date(existing)) {
                    groupJoinDateMap.set(history.group.id, history.addedAt);
                }
            }
        }

        const teamJoinDateMap = new Map<string, Date | string | number | null>();
        for (const history of teamHistory) {
            if (history.team?.id && history.action === "added") {
                const existing = teamJoinDateMap.get(history.team.id);
                // Keep the most recent "added" date
                if (!existing || new Date(history.addedAt) > new Date(existing)) {
                    teamJoinDateMap.set(history.team.id, history.addedAt);
                }
            }
        }

        for (const group of groups) {
            // Check if student is in groupStudents
            const isInGroup = group.groupStudents?.some(
                (student) => student.id === studentId
            );

            // Find teams within this group where the student is a member
            const studentTeams: string[] = [];
            const studentTeamNames: string[] = [];
            const studentTeamJoinedAts: (Date | string | number | null)[] = [];

            if (group.groupTeams) {
                for (const team of group.groupTeams) {
                    const isInTeam = team.teamStudents?.some(
                        (student) => student.id === studentId
                    );
                    if (isInTeam) {
                        studentTeams.push(team.id);
                        studentTeamNames.push(team.name);
                        studentTeamJoinedAts.push(teamJoinDateMap.get(team.id) || null);
                    }
                }
            }

            // Include group if student is directly in group OR in any team within the group
            if (isInGroup || studentTeams.length > 0) {
                result.push({
                    groupId: group.id,
                    groupName: group.name,
                    groupJoinedAt: groupJoinDateMap.get(group.id) || null,
                    teamIds: studentTeams,
                    teamNames: studentTeamNames,
                    teamJoinedAts: studentTeamJoinedAts,
                });
            }
        }

        return result;
    }, [groups, studentId, groupHistory, teamHistory]);

    return (
        <Card style={{ backgroundColor: "var(--student-card-bg)" }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    Groups & Teams
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="current" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="current">Current</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="current" className="mt-0">
                        <ScrollArea className="h-[300px] md:h-[400px]">
                            <div className="pr-4">
                                {studentGroupsTeams.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Users className="size-12 mx-auto mb-2 opacity-50" />
                                        <p>No groups or teams yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {studentGroupsTeams.map((item) => (
                                            <div
                                                key={item.groupId}
                                                className="space-y-2 border-b pb-4 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-sm">{item.groupName}</h4>
                                                    {item.groupJoinedAt && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Joined {format(new Date(item.groupJoinedAt), "MMM d, yyyy")}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.teamNames.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2 pl-2">
                                                        {item.teamNames.map((teamName, index) => (
                                                            <div key={item.teamIds[index]} className="flex items-center gap-1">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {teamName}
                                                                </Badge>
                                                                {item.teamJoinedAts[index] && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ({format(new Date(item.teamJoinedAts[index]!), "MMM d, yyyy")})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground pl-2">
                                                        (No team)
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="history" className="mt-0">
                        <ScrollArea className="h-[300px] md:h-[400px]">
                            <div className="pr-4">
                                {historyTimeline.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Users className="size-12 mx-auto mb-2 opacity-50" />
                                        <p>No history yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {historyTimeline.map((event) => (
                                            <div
                                                key={event.id}
                                                className="flex items-start gap-3 p-3 rounded-md border bg-card"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge
                                                            variant={event.action === "added" ? "default" : "destructive"}
                                                            className="text-xs"
                                                        >
                                                            {event.action === "added" ? "Added" : "Removed"}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {event.type === "group" ? "Group" : "Team"}
                                                        </Badge>
                                                        <span className="font-medium text-sm">{event.name}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
