/** @format */

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hand, ChevronDown, ChevronUp, RotateCcw, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/db/db";
import { useClassRoster } from "@/hooks/use-class-roster";
import { PickerInstanceSelector } from "./picker-instance-selector";
import { CreatePickerInstanceDialog } from "./create-picker-instance-dialog";
import { EditPickerInstanceDialog } from "./edit-picker-instance-dialog";
import { DeletePickerInstanceDialog } from "./delete-picker-instance-dialog";
import {
    createActiveRound,
    pickRandomStudent,
    savePick,
    completeRound,
    startNewRound,
    calculatePickStats,
} from "@/lib/randomizer/picker";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { PickerCaseStudy } from "./picker-case-study";
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

type PickerInstancesQueryResult = {
    picker_instances: InstaQLEntity<AppSchema, "picker_instances", {}>[];
};

type ClassQueryResult = {
    classes: ClassEntity[];
};

export function PickerTabContent({ classId }: PickerTabContentProps) {
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [isPicking, setIsPicking] = useState(false);
    const [lastPicked, setLastPicked] = useState<InstaQLEntity<AppSchema, "$users"> | null>(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    // Capture the students list at pick time so animation doesn't break when state updates
    const [animationStudents, setAnimationStudents] = useState<InstaQLEntity<AppSchema, "$users">[]>([]);

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

    // Query all picker instances for the class
    const { data: instancesData } = db.useQuery(
        classId
            ? {
                  picker_instances: {
                      $: {
                          where: { "class.id": classId },
                          order: { created: "desc" as const },
                      },
                  },
              }
            : null
    );

    const typedInstancesData = (instancesData as PickerInstancesQueryResult | undefined) ?? null;
    const allInstances = typedInstancesData?.picker_instances ?? [];

    // Auto-select first instance if none selected and instances exist
    useEffect(() => {
        if (selectedInstanceId === null && allInstances.length > 0) {
            setSelectedInstanceId(allInstances[0].id);
        }
    }, [selectedInstanceId, allInstances]);

    const selectedInstance = allInstances.find((i) => i.id === selectedInstanceId);

    // Query all picker rounds for the selected instance
    const { data: roundsData } = db.useQuery(
        selectedInstanceId
            ? {
                  picker_rounds: {
                      $: {
                          where: { "instance.id": selectedInstanceId },
                          order: { startedAt: "desc" as const },
                      },
                      picks: {},
                  },
              }
            : null
    );

    const typedRoundsData = (roundsData as PickerRoundsQueryResult | undefined) ?? null;
    const allRounds = typedRoundsData?.picker_rounds ?? [];

    // Find active round for current instance
    const activeRound = useMemo(() => {
        if (!selectedInstanceId) return undefined;
        return allRounds.find((r) => r.isActive);
    }, [allRounds, selectedInstanceId]);

    // Filter students by instance scope
    const filteredStudents = useMemo(() => {
        if (!selectedInstance) return [];
        const students = classEntity?.classStudents ?? [];
        if (selectedInstance.scopeType === "class") {
            return students;
        } else if (selectedInstance.scopeType === "group") {
            return students.filter((s) =>
                (s.studentGroups ?? []).some((g) => g.id === selectedInstance.scopeId)
            );
        } else {
            // scopeType === "team"
            return students.filter((s) =>
                (s.studentTeams ?? []).some((t) => t.id === selectedInstance.scopeId)
            );
        }
    }, [classEntity?.classStudents, selectedInstance]);

    // Separate students into picked and unpicked
    // IMPORTANT: Depend on allRounds to ensure re-run when InstantDB updates
    // The picks array reference might be stable even when mutated, so we read
    // activeRound?.picks inside the callback and depend on allRounds
    const { pickedStudents, unpickedStudents } = useMemo(() => {
        // Read picks fresh from activeRound inside the callback
        const currentPicks = activeRound?.picks ?? [];
        const currentPickedIds = new Set(currentPicks.map((p: PickerPick) => p.studentId));
        
        const picked: InstaQLEntity<AppSchema, "$users">[] = [];
        const unpicked: InstaQLEntity<AppSchema, "$users">[] = [];

        for (const student of filteredStudents) {
            if (currentPickedIds.has(student.id)) {
                picked.push(student);
            } else {
                unpicked.push(student);
            }
        }

        // Sort picked by position using the fresh picks array
        picked.sort((a, b) => {
            const pickA = currentPicks.find((p: PickerPick) => p.studentId === a.id);
            const pickB = currentPicks.find((p: PickerPick) => p.studentId === b.id);
            return (pickA?.position ?? 0) - (pickB?.position ?? 0);
        });

        return { pickedStudents: picked, unpickedStudents: unpicked };
    }, [filteredStudents, activeRound, allRounds]);

    // Calculate all-time stats for the selected instance
    const stats = useMemo(() => {
        return calculatePickStats(allRounds);
    }, [allRounds]);

    // Note: We don't create the round in useEffect anymore
    // It will be created on-demand when the user clicks "Pick Random"

    const handlePick = async () => {
        if (unpickedStudents.length === 0) {
            return;
        }

        // Pick random student FIRST, before any state changes
        const pickedStudent = pickRandomStudent(unpickedStudents);
        if (!pickedStudent) {
            return;
        }

        // Capture the current unpicked students for the animation BEFORE the DB update
        // This ensures the animation can find the picked student even after InstantDB
        // reactively updates unpickedStudents (which would no longer contain the pick)
        setAnimationStudents([...unpickedStudents]);
        setLastPicked(pickedStudent);
        setIsPicking(true);
        setShowAnimation(true);

        if (!selectedInstance) {
            console.error("No picker instance selected");
            return;
        }

        try {
            // Ensure we have an active round
            let roundId: string;
            let currentPickCount = 0;
            
            if (activeRound) {
                roundId = activeRound.id;
                currentPickCount = activeRound.picks?.length ?? 0;
            } else {
                // Create round if it doesn't exist
                roundId = await createActiveRound(
                    selectedInstance.id,
                    classId,
                    selectedInstance.scopeType,
                    selectedInstance.scopeId,
                    selectedInstance.scopeName
                );
                currentPickCount = 0;
            }

            // Get student name
            const roster = getRosterForStudent(pickedStudent.id);
            const studentName =
                roster && (roster.firstName || roster.lastName)
                    ? `${roster.firstName || ""} ${roster.lastName || ""}`.trim()
                    : `${pickedStudent.firstName || ""} ${pickedStudent.lastName || ""}`.trim() ||
                      pickedStudent.email ||
                      "Unknown";

            // Calculate position (next in sequence)
            const position = currentPickCount + 1;

            // Save pick
            await savePick(pickedStudent, roundId, position, studentName);

            // Check if all students are picked
            if (unpickedStudents.length === 1) {
                // This was the last student
                await completeRound(roundId);
            }

            // The query will update reactively, causing the UI to re-render
            // and move the student from unpicked to picked automatically
            // Animation stays open until user closes it
        } catch (error) {
            console.error("Failed to pick student:", error);
            setShowAnimation(false);
            setLastPicked(null);
            setAnimationStudents([]);
        } finally {
            setIsPicking(false);
        }
    };

    const handleNewRound = async () => {
        if (!activeRound || !selectedInstance) return;

        try {
            await startNewRound(
                selectedInstance.id,
                classId,
                selectedInstance.scopeType,
                selectedInstance.scopeId,
                selectedInstance.scopeName,
                activeRound.id
            );
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

    // Show empty state if no instances exist
    if (allInstances.length === 0) {
        return (
            <div className="space-y-6">
                <div className="max-w-2xl mx-auto">
                    <PickerCaseStudy />
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Hand className="size-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Pickers Created</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Create your first picker instance to start picking students.
                        </p>
                        <CreatePickerInstanceDialog classId={classId} groups={classEntity?.groups ?? []}>
                            <Button>
                                Create First Picker
                            </Button>
                        </CreatePickerInstanceDialog>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-2xl mx-auto">
                <PickerCaseStudy />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PickerInstanceSelector
                        classId={classId}
                        instances={allInstances}
                        selectedInstanceId={selectedInstanceId}
                        onInstanceChange={setSelectedInstanceId}
                        groups={classEntity?.groups ?? []}
                    />
                    {selectedInstance && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                    <MoreVertical className="size-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <EditPickerInstanceDialog
                                    instance={selectedInstance}
                                    classId={classId}
                                    groups={classEntity?.groups ?? []}
                                    asDropdownItem
                                >
                                    Edit
                                </EditPickerInstanceDialog>
                                <DeletePickerInstanceDialog
                                    instance={selectedInstance}
                                    asDropdownItem
                                    onDelete={() => {
                                        // Select another instance if available
                                        const remaining = allInstances.filter((i) => i.id !== selectedInstance.id);
                                        setSelectedInstanceId(remaining.length > 0 ? remaining[0].id : null);
                                    }}
                                >
                                    Delete
                                </DeletePickerInstanceDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <Button
                    onClick={handlePick}
                    disabled={isPicking || unpickedStudents.length === 0 || !selectedInstance}
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
            {activeRound ? (
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
            ) : selectedInstance ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">
                            {filteredStudents.length === 0
                                ? "No students in the selected scope."
                                : "Click 'Pick Random' to start a new picking round."}
                        </p>
                    </CardContent>
                </Card>
            ) : null}

            {/* Pick Animation */}
            {showAnimation && lastPicked && (
                <PickAnimation
                    student={lastPicked}
                    availableStudents={animationStudents}
                    onClose={() => {
                        setShowAnimation(false);
                        setLastPicked(null);
                        setAnimationStudents([]);
                    }}
                    getStudentName={(studentId) => {
                        const student = filteredStudents.find((s) => s.id === studentId);
                        if (!student) return "Unknown";
                        const roster = getRosterForStudent(studentId);
                        return roster && (roster.firstName || roster.lastName)
                            ? `${roster.firstName || ""} ${roster.lastName || ""}`.trim()
                            : `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                              student.email ||
                              "Unknown";
                    }}
                />
            )}
        </div>
    );
}
