/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Coins, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassRole } from "@/hooks/use-class-role";
import { useClassRoster } from "@/hooks/use-class-roster";
import { db } from "@/lib/db/db";
import { useClassById, type ClassByRole } from "@/hooks/use-class-hooks";
import { useClassBehaviorLogs } from "@/hooks/use-class-behavior-logs";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { StudentPointsCard } from "./-components/student-points-card";
import { ApplyActionDialog } from "./-components/apply-action-dialog";
import { PointsPageSkeleton } from "./-components/points-page-skeleton";

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
        classStudents?: { studentGroups?: {}; studentTeams?: {} };
        groups?: { groupTeams?: {} };
        behaviorLogs?: { behavior: {}; student: {} };
        rewardRedemptions?: { rewardItem: {}; student: {} };
        attendanceRecords?: { student: {}; createdBy: {} };
    }
>;

type PointsQueryResult = { classes: ClassForPoints[] };

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;

    const { class: classEntity } = useClassById(classId);
    
    // Get today's date in YYYY-MM-DD format
    const getTodayDateString = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };
    const todayDateString = getTodayDateString();
    
    const { data, isLoading: dataLoading } = db.useQuery(
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
                      attendanceRecords: {
                          $: { where: { date: todayDateString } },
                          student: {},
                          createdBy: {},
                      },
                  },
              }
            : null
    );
    const typedData = (data as PointsQueryResult | undefined) ?? null;
    const classEntityWithRelations = typedData?.classes?.[0] || classEntity;
    const roleInfo = useClassRole(classEntityWithRelations as ClassByRole | undefined);

    // Show skeleton while data is loading, before RestrictedRoute blocks the render
    if (dataLoading) {
        return <PointsPageSkeleton />;
    }

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={!classEntity && classId !== null}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <PointsPageContent
                classEntity={classEntityWithRelations}
                classId={classId ?? ""}
                canManage={
                    roleInfo.isOwner ||
                    roleInfo.isAdmin ||
                    roleInfo.isTeacher ||
                    roleInfo.isAssistantTeacher
                }
            />
        </RestrictedRoute>
    );
}

interface PointsPageContentProps {
    classEntity: ClassForPoints | undefined;
    classId: string;
    canManage: boolean;
}

function PointsPageContent({
    classEntity,
    classId,
    canManage,
}: PointsPageContentProps) {
    const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_VALUE);
    const [selectedTeamId, setSelectedTeamId] = useState<string>(ALL_VALUE);
    const [hideAbsent, setHideAbsent] = useState<boolean>(false);
    const { getRosterForStudent } = useClassRoster(classId);
    const { behaviorLogs, rewardRedemptions } = useClassBehaviorLogs(classId);
    
    // Get today's date for attendance query
    const getTodayDateString = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };
    const todayDateString = getTodayDateString();
    const attendanceRecords = classEntity?.attendanceRecords ?? [];
    
    // Create a map of student ID to attendance status
    const attendanceMap = useMemo(() => {
        const map = new Map<string, "present" | "late" | "absent">();
        for (const record of attendanceRecords) {
            if (record.student?.id && record.status && record.date === todayDateString) {
                map.set(record.student.id, record.status as "present" | "late" | "absent");
            }
        }
        return map;
    }, [attendanceRecords, todayDateString]);

    const groups = classEntity?.groups ?? [];
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);
    const teams = selectedGroup?.groupTeams ?? [];

    // Reset team when group changes
    useEffect(() => {
        setSelectedTeamId(ALL_VALUE);
    }, [selectedGroupId]);

    const pointsMap = useMemo(() => {
        const map = new Map<string, number>();
        const logs = behaviorLogs ?? [];
        const redemptions = rewardRedemptions ?? [];
        const students = classEntity?.classStudents ?? [];

        for (const s of students) {
            const fromLogs = logs
                .filter((l) => l.student?.id === s.id)
                .reduce(
                    (sum, l) =>
                        sum + (l.behavior?.points ?? 0) * ((l.quantity ?? 1) as number),
                    0
                );
            const spent = redemptions
                .filter((r) => r.student?.id === s.id)
                .reduce(
                    (sum, r) =>
                        sum + (r.rewardItem?.cost ?? 0) * ((r.quantity ?? 1) as number),
                    0
                );
            map.set(s.id, fromLogs - spent);
        }
        return map;
    }, [
        behaviorLogs,
        rewardRedemptions,
        classEntity?.classStudents,
    ]);

    const getStudentAggregates = (studentId: string) => {
        const logs = (behaviorLogs ?? []).filter(
            (l) => l.student?.id === studentId
        );
        const redemptions = (rewardRedemptions ?? []).filter(
            (r) => r.student?.id === studentId
        );

        let awardedPoints = 0;
        let removedPoints = 0;
        let redeemedPoints = 0;

        for (const log of logs) {
            const points = log.behavior?.points ?? 0;
            const qty = (log.quantity ?? 1) as number;
            if (points >= 0) {
                awardedPoints += points * qty;
            } else {
                removedPoints += Math.abs(points) * qty;
            }
        }

        for (const redemption of redemptions) {
            const cost = redemption.rewardItem?.cost ?? 0;
            const qty = (redemption.quantity ?? 1) as number;
            redeemedPoints += cost * qty;
        }

        return { awardedPoints, removedPoints, redeemedPoints };
    };

    const filteredStudents = useMemo(() => {
        let list = classEntity?.classStudents ?? [];
        
        // Apply group/team filters
        if (selectedGroupId !== ALL_VALUE) {
            if (selectedTeamId === ALL_VALUE) {
                list = list.filter((s) =>
                    (s.studentGroups ?? []).some((g) => g.id === selectedGroupId)
                );
            } else {
                list = list.filter((s) =>
                    (s.studentTeams ?? []).some((t) => t.id === selectedTeamId)
                );
            }
        }
        
        // Apply hide absent filter
        if (hideAbsent) {
            list = list.filter((s) => {
                const status = attendanceMap.get(s.id);
                return status !== "absent";
            });
        }
        
        return list;
    }, [
        classEntity?.classStudents,
        selectedGroupId,
        selectedTeamId,
        hideAbsent,
        attendanceMap,
    ]);

    type LastAction = {
        type: "behavior" | "redemption";
        id: string;
        description: string;
    } | null;

    type LastBehavior = {
        behaviorId: string;
        behavior: { name: string; points: number };
    } | null;

    const toMs = (v: string | number | Date | null | undefined) =>
        v == null ? 0 : typeof v === "number" ? v : new Date(v).getTime();

    const getLastActionForStudent = (studentId: string): LastAction => {
        const logs = (behaviorLogs ?? [])
            .filter((l) => l.student?.id === studentId)
            .map((l) => ({
                type: "behavior" as const,
                id: l.id,
                createdAt: l.createdAt,
                description: `Behavior: ${l.behavior?.name ?? "Unknown"} (${(l.behavior?.points ?? 0) >= 0 ? "+" : ""}${l.behavior?.points ?? 0})`,
            }));
        const redemptions = (rewardRedemptions ?? [])
            .filter((r) => r.student?.id === studentId)
            .map((r) => ({
                type: "redemption" as const,
                id: r.id,
                createdAt: r.createdAt,
                description: `Reward: ${r.rewardItem?.name ?? "Unknown"} (-${r.rewardItem?.cost ?? 0})`,
            }));
        const combined = [...logs, ...redemptions].sort(
            (a, b) => toMs(b.createdAt) - toMs(a.createdAt)
        );
        const first = combined[0];
        if (!first) return null;
        return { type: first.type, id: first.id, description: first.description };
    };

    const getLastBehaviorForStudent = (studentId: string): LastBehavior => {
        const logs = (behaviorLogs ?? [])
            .filter((l) => l.student?.id === studentId)
            .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
        const first = logs[0];
        if (!first?.behavior?.id) return null;
        return {
            behaviorId: first.behavior.id,
            behavior: {
                name: first.behavior?.name ?? "Unknown",
                points: first.behavior?.points ?? 0,
            },
        };
    };

    return (
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
                <div className="flex flex-wrap gap-6 items-end">
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
                    
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="hide-absent"
                            checked={hideAbsent}
                            onCheckedChange={(checked) =>
                                setHideAbsent(checked === true)
                            }
                        />
                        <Label
                            htmlFor="hide-absent"
                            className="text-sm font-normal cursor-pointer"
                        >
                            Hide absent students
                        </Label>
                    </div>
                </div>

                {/* Cards */}
                {filteredStudents.length === 0 ? (
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
                        {filteredStudents.map((student) => {
                            const aggregates = getStudentAggregates(student.id);
                            const attendanceStatus = attendanceMap.get(student.id);
                            const card = (
                                <StudentPointsCard
                                    key={student.id}
                                    student={student}
                                    classId={classId}
                                    totalPoints={pointsMap.get(student.id) ?? 0}
                                    existingRoster={getRosterForStudent(student.id)}
                                    canManage={canManage}
                                    lastAction={getLastActionForStudent(student.id)}
                                    lastBehavior={getLastBehaviorForStudent(
                                        student.id
                                    )}
                                    attendanceStatus={attendanceStatus}
                                />
                            );

                            if (canManage) {
                                return (
                                    <ApplyActionDialog
                                        key={student.id}
                                        student={student}
                                        classId={classId}
                                        totalPoints={pointsMap.get(student.id) ?? 0}
                                        existingRoster={getRosterForStudent(student.id)}
                                        awardedPoints={aggregates.awardedPoints}
                                        removedPoints={aggregates.removedPoints}
                                        redeemedPoints={aggregates.redeemedPoints}
                                        canManage={canManage}
                                    >
                                        {card}
                                    </ApplyActionDialog>
                                );
                            }

                            return card;
                        })}
                    </div>
                )}
            </div>
    );
}
