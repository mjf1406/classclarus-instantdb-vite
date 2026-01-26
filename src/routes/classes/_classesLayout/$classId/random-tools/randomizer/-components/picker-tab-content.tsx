/** @format */

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hand, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { db } from "@/lib/db/db";
import { useClassRoster } from "@/hooks/use-class-roster";
import { ScopeFilterSelect, type ScopeSelection } from "./scope-filter-select";
import {
    getOrCreateActiveRound,
    pickRandomStudent,
    savePick,
    completeRound,
    startNewRound,
    calculatePickStats,
    type StudentPickStats,
} from "@/lib/randomizer/picker";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { PickAnimation } from "./pick-animation";

interface PickerTabContentProps {
    classId: string;
}

type PickerRound = InstaQLEntity<AppSchema, "picker_rounds", { picks: {} }>;
type PickerPick = InstaQLEntity<AppSchema, "picker_picks", {}>;
type ClassEntity = InstaQLEntity<
    AppSchema,
    "classes",
    {
        classStudents?: { studentGroups?: {}; studentTeams?: {} };
        groups?: { groupTeams?: {} };
    }
>;

type PickerRoundsQueryResult = {
    picker_rounds: PickerRound[];
};

type ClassQueryResult = {
    classes: ClassEntity[];
};

export function PickerTabContent({ classId }: PickerTabContentProps) {
    const [scope, setScope] = useState<ScopeSelection>({
        type: "class",
        id: classId,
        name: "All Students",
    });
    const [isPicking, setIsPicking] = useState(false);
    const [lastPicked, setLastPicked] = useState<InstaQLEntity<AppSchema, "$users"> | null>(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);

    const { getRosterForStudent } = useClassRoster(classId);

    // Query class data with students, groups, and teams
    const { data: classData } = db.useQuery(
        classId
            ? {
                  classes: {
                      $: { where: { id: classId } },
                      classStudents: {
                          studentGroups: {},
                          studentTeams: {},
                      },
                      groups: { groupTeams: {} },
                  },
              }
            : null
    );

    const typedClassData = (classData as ClassQueryResult | undefined) ?? null;
    const classEntity = typedClassData?.classes?.[0];

    // Query all picker rounds for the class
    const { data: roundsData } = db.useQuery(
        classId
            ? {
                  picker_rounds: {
                      $: {
                          where: { "class.id": classId },
                          order: { startedAt: "desc" as const },
                      },
                      picks: {},
                  },
              }
            : null
    );

    const typedRoundsData = (roundsData as PickerRoundsQueryResult | undefined) ?? null;
    const allRounds = typedRoundsData?.picker_rounds ?? [];

    // Find active round for current scope
    const activeRound = useMemo(() => {
        return allRounds.find(
            (r) =>
                r.isActive &&
                r.scopeType === scope.type &&
                r.scopeId === scope.id
        );
    }, [allRounds, scope.type, scope.id]);

    // Filter students by scope
    const filteredStudents = useMemo(() => {
        const students = classEntity?.classStudents ?? [];
        if (scope.type === "class") {
            return students;
        } else if (scope.type === "group") {
            return students.filter((s) =>
                (s.studentGroups ?? []).some((g) => g.id === scope.id)
            );
        } else {
            // scope.type === "team"
            return students.filter((s) =>
                (s.studentTeams ?? []).some((t) => t.id === scope.id)
            );
        }
    }, [classEntity?.classStudents, scope]);

    // Get picked student IDs for current round
    const pickedStudentIds = useMemo(() => {
        if (!activeRound) return new Set<string>();
        return new Set(
            (activeRound.picks ?? []).map((pick: PickerPick) => pick.studentId)
        );
    }, [activeRound]);

    // Separate students into picked and unpicked
    const { pickedStudents, unpickedStudents } = useMemo(() => {
        const picked: InstaQLEntity<AppSchema, "$users">[] = [];
        const unpicked: InstaQLEntity<AppSchema, "$users">[] = [];

        for (const student of filteredStudents) {
            if (pickedStudentIds.has(student.id)) {
                picked.push(student);
            } else {
                unpicked.push(student);
            }
        }

        // Sort picked by position
        if (activeRound) {
            const picks = (activeRound.picks ?? []) as PickerPick[];
            picked.sort((a, b) => {
                const pickA = picks.find((p) => p.studentId === a.id);
                const pickB = picks.find((p) => p.studentId === b.id);
                return (pickA?.position ?? 0) - (pickB?.position ?? 0);
            });
        }

        return { pickedStudents: picked, unpickedStudents: unpicked };
    }, [filteredStudents, pickedStudentIds, activeRound]);

    // Calculate all-time stats
    const stats = useMemo(() => {
        return calculatePickStats(allRounds);
    }, [allRounds]);

    // Ensure active round exists when scope changes
    useEffect(() => {
        if (!activeRound && filteredStudents.length > 0) {
            getOrCreateActiveRound(classId, scope).catch((error) => {
                console.error("Failed to create active round:", error);
            });
        }
    }, [activeRound, classId, scope, filteredStudents.length]);

    const handlePick = async () => {
        if (unpickedStudents.length === 0 || !activeRound) {
            return;
        }

        setIsPicking(true);
        setShowAnimation(true);

        try {
            // Pick random student
            const pickedStudent = pickRandomStudent(unpickedStudents);
            if (!pickedStudent) {
                return;
            }

            setLastPicked(pickedStudent);

            // Get student name
            const roster = getRosterForStudent(pickedStudent.id);
            const studentName =
                roster && (roster.firstName || roster.lastName)
                    ? `${roster.firstName || ""} ${roster.lastName || ""}`.trim()
                    : `${pickedStudent.firstName || ""} ${pickedStudent.lastName || ""}`.trim() ||
                      pickedStudent.email ||
                      "Unknown";

            // Calculate position (next in sequence)
            const position = (activeRound.picks?.length ?? 0) + 1;

            // Save pick
            await savePick(pickedStudent, activeRound.id, position, studentName);

            // Check if all students are picked
            if (unpickedStudents.length === 1) {
                // This was the last student
                await completeRound(activeRound.id);
            }

            // Hide animation after a delay
            setTimeout(() => {
                setShowAnimation(false);
                setLastPicked(null);
            }, 2000);
        } catch (error) {
            console.error("Failed to pick student:", error);
        } finally {
            setIsPicking(false);
        }
    };

    const handleNewRound = async () => {
        if (!activeRound) return;

        try {
            await startNewRound(classId, scope, activeRound.id);
        } catch (error) {
            console.error("Failed to start new round:", error);
        }
    };

    // Get max position from stats to determine table columns
    const maxPosition = useMemo(() => {
        let max = 0;
        for (const stat of stats) {
            for (const pos of stat.positionCounts.keys()) {
                max = Math.max(max, pos);
            }
        }
        return max;
    }, [stats]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <ScopeFilterSelect
                    classId={classId}
                    selectedScope={scope}
                    onScopeChange={setScope}
                    groups={classEntity?.groups ?? []}
                />
                <Button
                    onClick={handlePick}
                    disabled={isPicking || unpickedStudents.length === 0 || !activeRound}
                >
                    {isPicking ? (
                        <>
                            <Hand className="mr-2 size-4 animate-pulse" />
                            Picking...
                        </>
                    ) : (
                        <>
                            <Hand className="mr-2 size-4" />
                            Pick Random
                        </>
                    )}
                </Button>
            </div>

            {/* Statistics Collapsible (Default Collapsed) */}
            <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                        <span>All-Time Pick Statistics</span>
                        {statsOpen ? (
                            <ChevronUp className="size-4" />
                        ) : (
                            <ChevronDown className="size-4" />
                        )}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <Card>
                        <CardContent className="pt-6">
                            {stats.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    No pick statistics yet. Pick your first student to see stats.
                                </p>
                            ) : (
                                <ScrollArea className="w-full">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                {Array.from({ length: maxPosition }, (_, i) => (
                                                    <TableHead key={i + 1} className="text-center">
                                                        {i + 1}
                                                        {i === 0 && "st"}
                                                        {i === 1 && "nd"}
                                                        {i === 2 && "rd"}
                                                        {i > 2 && "th"}
                                                    </TableHead>
                                                ))}
                                                <TableHead className="text-center">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats
                                                .sort((a, b) => a.studentName.localeCompare(b.studentName))
                                                .map((stat) => (
                                                    <TableRow key={stat.studentId}>
                                                        <TableCell>{stat.studentName}</TableCell>
                                                        {Array.from({ length: maxPosition }, (_, i) => {
                                                            const position = i + 1;
                                                            const count = stat.positionCounts.get(position) ?? 0;
                                                            return (
                                                                <TableCell key={position} className="text-center">
                                                                    {count > 0 ? count : "-"}
                                                                </TableCell>
                                                            );
                                                        })}
                                                        <TableCell className="text-center font-medium">
                                                            {stat.totalPicks}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* Current Round */}
            {activeRound && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    Current Round
                                    {activeRound.completedAt && " (Completed)"}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Started {new Date(activeRound.startedAt).toLocaleString()}
                                </p>
                            </div>
                            {!activeRound.completedAt && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNewRound}
                                >
                                    <RotateCcw className="mr-2 size-4" />
                                    New Round
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Not Yet Picked */}
                            <div>
                                <div className="text-sm font-medium mb-2">
                                    Not Yet Picked ({unpickedStudents.length})
                                </div>
                                {unpickedStudents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        All students have been picked!
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {unpickedStudents.map((student) => {
                                            const roster = getRosterForStudent(student.id);
                                            const name =
                                                roster && (roster.firstName || roster.lastName)
                                                    ? `${roster.firstName || ""} ${roster.lastName || ""}`.trim()
                                                    : `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                                                      student.email ||
                                                      "Unknown";
                                            return (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center gap-2 p-2 rounded border"
                                                >
                                                    <Hand className="size-4 text-muted-foreground" />
                                                    <span>{name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Already Picked */}
                            <div>
                                <div className="text-sm font-medium mb-2">
                                    Already Picked ({pickedStudents.length})
                                </div>
                                {pickedStudents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        No students picked yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {pickedStudents.map((student) => {
                                            const roster = getRosterForStudent(student.id);
                                            const name =
                                                roster && (roster.firstName || roster.lastName)
                                                    ? `${roster.firstName || ""} ${roster.lastName || ""}`.trim()
                                                    : `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                                                      student.email ||
                                                      "Unknown";
                                            const pick = (activeRound.picks ?? []).find(
                                                (p: PickerPick) => p.studentId === student.id
                                            );
                                            const position = pick?.position ?? 0;
                                            return (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center gap-2 p-2 rounded border"
                                                >
                                                    <span className="font-medium text-muted-foreground w-8">
                                                        {position}.
                                                    </span>
                                                    <span>{name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pick Animation */}
            {showAnimation && lastPicked && (
                <PickAnimation
                    student={lastPicked}
                    onClose={() => {
                        setShowAnimation(false);
                        setLastPicked(null);
                    }}
                />
            )}
        </div>
    );
}
