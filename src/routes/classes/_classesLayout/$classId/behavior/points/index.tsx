/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Coins, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassRole } from "@/hooks/use-class-role";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { StudentPointsCard } from "./-components/student-points-card";

const ALL_VALUE = "__all__";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/behavior/points/"
)({
    component: RouteComponent,
});

type ClassForPoints = InstaQLEntity<
    AppSchema,
    "classes",
    {
        owner: {};
        organization: {};
        classAdmins: {};
        classTeachers: {};
        classAssistantTeachers: {};
        classGuardians: {};
        classStudents: { studentGroups: {}; studentTeams: {} };
        groups: { groupTeams: {} };
        classRoster: { student: {} };
        behaviorLogs: { behavior: {}; student: {} };
        rewardRedemptions: { rewardItem: {}; student: {} };
    }
>;

type PointsQueryResult = { classes: ClassForPoints[] };

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_VALUE);
    const [selectedTeamId, setSelectedTeamId] = useState<string>(ALL_VALUE);

    const pointsQuery =
        classId && classId.trim() !== ""
            ? {
                  classes: {
                      $: { where: { id: classId } },
                      owner: {},
                      organization: {},
                      classAdmins: {},
                      classTeachers: {},
                      classAssistantTeachers: {},
                      classGuardians: {},
                      classStudents: {
                          studentGroups: {},
                          studentTeams: {},
                      },
                      groups: { groupTeams: {} },
                      classRoster: { student: {} },
                      behaviorLogs: { behavior: {}, student: {} },
                      rewardRedemptions: { rewardItem: {}, student: {} },
                  },
              }
            : null;

    const { data } = db.useQuery(pointsQuery);
    const typedData = (data as PointsQueryResult | undefined) ?? null;
    const classEntity = typedData?.classes?.[0];
    const roleInfo = useClassRole(classEntity);

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher || roleInfo.isAssistantTeacher;

    const groups = classEntity?.groups ?? [];
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);
    const teams = selectedGroup?.groupTeams ?? [];

    // Reset team when group changes
    useEffect(() => {
        setSelectedTeamId(ALL_VALUE);
    }, [selectedGroupId]);

    const pointsMap = useMemo(() => {
        const map = new Map<string, number>();
        const logs = classEntity?.behaviorLogs ?? [];
        const redemptions = classEntity?.rewardRedemptions ?? [];
        const students = classEntity?.classStudents ?? [];

        for (const s of students) {
            const fromLogs = logs
                .filter((l) => l.student?.id === s.id)
                .reduce((sum, l) => sum + (l.behavior?.points ?? 0), 0);
            const spent = redemptions
                .filter((r) => r.student?.id === s.id)
                .reduce((sum, r) => sum + (r.rewardItem?.cost ?? 0), 0);
            map.set(s.id, fromLogs - spent);
        }
        return map;
    }, [
        classEntity?.behaviorLogs,
        classEntity?.rewardRedemptions,
        classEntity?.classStudents,
    ]);

    const filteredStudents = useMemo(() => {
        const list = classEntity?.classStudents ?? [];
        if (selectedGroupId === ALL_VALUE) return list;
        if (selectedTeamId === ALL_VALUE) {
            return list.filter((s) =>
                (s.studentGroups ?? []).some((g) => g.id === selectedGroupId)
            );
        }
        return list.filter((s) =>
            (s.studentTeams ?? []).some((t) => t.id === selectedTeamId)
        );
    }, [
        classEntity?.classStudents,
        selectedGroupId,
        selectedTeamId,
    ]);

    const getRosterForStudent = (studentId: string) => {
        const roster = (classEntity?.classRoster ?? []).find(
            (r) => r.student?.id === studentId
        );
        if (!roster) return null;
        return { id: roster.id, number: roster.number };
    };

    const isLoading = !classEntity && pointsQuery !== null;

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coins className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Points
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage points for your students
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-6">
                    <div className="space-y-2">
                        <Label>Group</Label>
                        <RadioGroup
                            value={selectedGroupId}
                            onValueChange={setSelectedGroupId}
                            className="flex flex-wrap gap-3"
                        >
                            <label className="flex cursor-pointer items-center gap-2">
                                <RadioGroupItem value={ALL_VALUE} />
                                <span className="text-sm">All</span>
                            </label>
                            {groups.map((g) => (
                                <label
                                    key={g.id}
                                    className="flex cursor-pointer items-center gap-2"
                                >
                                    <RadioGroupItem value={g.id} />
                                    <span className="text-sm">
                                        {g.name ?? "Unnamed"}
                                    </span>
                                </label>
                            ))}
                        </RadioGroup>
                    </div>

                    {selectedGroupId !== ALL_VALUE && (
                        <div className="space-y-2">
                            <Label>Team</Label>
                            <RadioGroup
                                value={selectedTeamId}
                                onValueChange={setSelectedTeamId}
                                className="flex flex-wrap gap-3"
                            >
                                <label className="flex cursor-pointer items-center gap-2">
                                    <RadioGroupItem value={ALL_VALUE} />
                                    <span className="text-sm">All</span>
                                </label>
                                {teams.map((t) => (
                                    <label
                                        key={t.id}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <RadioGroupItem value={t.id} />
                                        <span className="text-sm">
                                            {t.name ?? "Unnamed"}
                                        </span>
                                    </label>
                                ))}
                            </RadioGroup>
                        </div>
                    )}
                </div>

                {/* Cards */}
                {isLoading ? (
                    <div className="grid grid-cols-4 gap-2 md:gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-[100px] lg:h-[120px]" />
                        ))}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                {(classEntity?.classStudents?.length ?? 0) === 0
                                    ? "No students in this class."
                                    : "No students match the current filters."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-4 gap-2 md:gap-4">
                        {filteredStudents.map((student) => (
                            <StudentPointsCard
                                key={student.id}
                                student={student}
                                classId={classId ?? ""}
                                totalPoints={pointsMap.get(student.id) ?? 0}
                                existingRoster={getRosterForStudent(student.id)}
                                canManage={canManage}
                            />
                        ))}
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
