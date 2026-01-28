/** @format */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shuffle, ChevronDown, ChevronUp, Eye, Edit2, Check, X, Trash2 } from "lucide-react";
import { db } from "@/lib/db/db";
import { useClassRoster } from "@/hooks/use-class-roster";
import { ScopeFilterSelect, type ScopeSelection } from "./scope-filter-select";
import {
    shuffleWithConstraints,
    calculateShuffleStats,
    saveShuffleRun,
    type ShuffleResult,
} from "@/lib/randomizer/shuffler";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { ShufflerCaseStudy } from "./shuffler-case-study";
import { ShuffleResultDialog } from "./shuffle-result-dialog";

interface ShufflerTabContentProps {
    classId: string;
}

type ShufflerRun = InstaQLEntity<AppSchema, "shuffler_runs", {}>;
type ClassEntity = InstaQLEntity<
    AppSchema,
    "classes",
    {
        classStudents?: { studentGroups?: {}; studentTeams?: {} };
        groups?: { groupTeams?: {} };
    }
>;

type ShufflerRunsQueryResult = {
    shuffler_runs: ShufflerRun[];
};

type ClassQueryResult = {
    classes: ClassEntity[];
};

export function ShufflerTabContent({ classId }: ShufflerTabContentProps) {
    const [scope, setScope] = useState<ScopeSelection>({
        type: "class",
        id: classId,
        name: "All Students",
    });
    const [isShuffling, setIsShuffling] = useState(false);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [statsOpen, setStatsOpen] = useState(false);
    const [shuffleName, setShuffleName] = useState("");
    const [editingRunId, setEditingRunId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    // Query all shuffler runs for the class
    const { data: runsData } = db.useQuery(
        classId
            ? {
                  shuffler_runs: {
                      $: {
                          where: { "class.id": classId },
                          order: { runDate: "desc" as const },
                      },
                  },
              }
            : null
    );

    const typedRunsData = (runsData as ShufflerRunsQueryResult | undefined) ?? null;
    const allRuns = typedRunsData?.shuffler_runs ?? [];

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

    // Build student map for stats calculation
    const studentMap = useMemo(() => {
        const map = new Map<string, { id: string; name: string }>();
        for (const student of filteredStudents) {
            const roster = getRosterForStudent(student.id);
            const name =
                roster && (roster.firstName || roster.lastName)
                    ? `${roster.firstName || ""} ${roster.lastName || ""}`.trim()
                    : `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                      student.email ||
                      "Unknown";
            map.set(student.id, { id: student.id, name });
        }
        return map;
    }, [filteredStudents, getRosterForStudent]);

    // Calculate stats for current scope
    const stats = useMemo(() => {
        return calculateShuffleStats(allRuns, scope.type, scope.id, studentMap);
    }, [allRuns, scope.type, scope.id, studentMap]);

    // Filter runs for current scope
    const scopedRuns = useMemo(() => {
        return allRuns.filter(
            (r) => r.scopeType === scope.type && r.scopeId === scope.id
        );
    }, [allRuns, scope.type, scope.id]);

    const handleShuffle = async () => {
        if (filteredStudents.length === 0) {
            return;
        }

        setIsShuffling(true);
        try {
            // Calculate stats for constraint algorithm
            const statsForShuffle = calculateShuffleStats(
                allRuns,
                scope.type,
                scope.id,
                studentMap
            );

            // Shuffle with constraints
            const shuffled = shuffleWithConstraints(
                filteredStudents,
                statsForShuffle
            );

            // Build results array
            const results: ShuffleResult[] = shuffled.map((student, index) => {
                const roster = getRosterForStudent(student.id);
                const name =
                    roster && (roster.firstName || roster.lastName)
                        ? `${roster.firstName || ""} ${roster.lastName || ""}`.trim()
                        : `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                          student.email ||
                          "Unknown";
                return {
                    studentId: student.id,
                    studentName: name,
                    position: index + 1,
                };
            });

            // Save to database
            await saveShuffleRun(results, scope, classId, shuffleName.trim() || undefined);
            setShuffleName(""); // Reset name after shuffle
        } catch (error) {
            console.error("Failed to shuffle:", error);
        } finally {
            setIsShuffling(false);
        }
    };

    const handleUpdateName = async (runId: string) => {
        try {
            await db.transact([
                db.tx.shuffler_runs[runId].update({
                    name: editingName.trim() || undefined,
                }),
            ]);
            setEditingRunId(null);
            setEditingName("");
        } catch (error) {
            console.error("Failed to update name:", error);
        }
    };

    const handleDelete = async (runId: string) => {
        setIsDeleting(true);
        try {
            await db.transact([db.tx.shuffler_runs[runId].delete()]);
            setDeletingRunId(null);
            // If the deleted run was selected, clear the selection
            if (selectedRunId === runId) {
                setSelectedRunId(null);
            }
        } catch (error) {
            console.error("Failed to delete shuffle run:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const selectedRun = scopedRuns.find((r) => r.id === selectedRunId);

    return (
        <div className="space-y-6">
            <div className="max-w-2xl mx-auto">
                <ShufflerCaseStudy />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <ScopeFilterSelect
                        classId={classId}
                        selectedScope={scope}
                        onScopeChange={setScope}
                        groups={classEntity?.groups ?? []}
                    />
                    <Button
                        onClick={handleShuffle}
                        disabled={isShuffling || filteredStudents.length === 0}
                    >
                        {isShuffling ? (
                            <>
                                <Shuffle className="mr-2 size-4 animate-spin" />
                                Shuffling...
                            </>
                        ) : (
                            <>
                                <Shuffle className="mr-2 size-4" />
                                Shuffle
                            </>
                        )}
                    </Button>
                </div>
                <div className="max-w-md">
                    <Input
                        placeholder="Name this shuffle (optional)"
                        value={shuffleName}
                        onChange={(e) => setShuffleName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !isShuffling && filteredStudents.length > 0) {
                                handleShuffle();
                            }
                        }}
                        disabled={isShuffling}
                    />
                </div>
            </div>

            {/* Statistics Collapsible */}
            <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                        <span>All-Time First/Last Statistics</span>
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
                                    No shuffle statistics yet. Create your first shuffle to see stats.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead className="text-center">First Count</TableHead>
                                            <TableHead className="text-center">Last Count</TableHead>
                                            <TableHead className="text-center">Total Shuffles</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats
                                            .sort((a, b) => a.studentName.localeCompare(b.studentName))
                                            .map((stat) => (
                                                <TableRow key={stat.studentId}>
                                                    <TableCell>{stat.studentName}</TableCell>
                                                    <TableCell className="text-center">
                                                        {stat.firstCount}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {stat.lastCount}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {stat.totalShuffles}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* Shuffle History */}
            <Card>
                <CardHeader>
                    <CardTitle>Shuffle History</CardTitle>
                </CardHeader>
                <CardContent>
                    {scopedRuns.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No shuffles yet. Click "Shuffle" to create your first shuffle.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {scopedRuns.map((run) => {
                                let firstStudent: string = "Unknown";
                                let lastStudent: string = "Unknown";
                                let totalStudents = 0;
                                let completedCount = 0;

                                try {
                                    const results: ShuffleResult[] = JSON.parse(run.results);
                                    totalStudents = results.length;
                                    if (results.length > 0) {
                                        firstStudent = results[0].studentName;
                                        lastStudent = results[results.length - 1].studentName;
                                    }
                                    
                                    // Parse completed student IDs
                                    if (run.completedStudentIds) {
                                        try {
                                            const completedIds: string[] = JSON.parse(run.completedStudentIds);
                                            completedCount = completedIds.length;
                                        } catch (e) {
                                            console.error("Failed to parse completed student IDs:", e);
                                        }
                                    }
                                } catch (e) {
                                    console.error("Failed to parse run results:", e);
                                }

                                const isEditing = editingRunId === run.id;
                                const displayName = run.name || new Date(run.runDate).toLocaleString();

                                return (
                                    <Card key={run.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Input
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handleUpdateName(run.id);
                                                                } else if (e.key === "Escape") {
                                                                    setEditingRunId(null);
                                                                    setEditingName("");
                                                                }
                                                            }}
                                                            placeholder="Enter name"
                                                            className="max-w-xs"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleUpdateName(run.id)}
                                                        >
                                                            <Check className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingRunId(null);
                                                                setEditingName("");
                                                            }}
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="font-medium flex items-center gap-2">
                                                        {displayName}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => {
                                                                setEditingRunId(run.id);
                                                                setEditingName(run.name || "");
                                                            }}
                                                        >
                                                            <Edit2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="text-sm text-muted-foreground">
                                                    {run.scopeName}
                                                </div>
                                                <div className="text-sm mt-1">
                                                    <span className="font-medium">First:</span> {firstStudent} |{" "}
                                                    <span className="font-medium">Last:</span> {lastStudent}
                                                </div>
                                                {totalStudents > 0 && (
                                                    <div className="text-sm mt-1 text-muted-foreground">
                                                        Progress: {completedCount}/{totalStudents} completed
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedRunId(run.id)}
                                                >
                                                    <Eye className="mr-2 size-4" />
                                                    View Details
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setDeletingRunId(run.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Shuffle Result Dialog */}
            {selectedRun && (
                <ShuffleResultDialog
                    run={selectedRun}
                    open={selectedRunId !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedRunId(null);
                        }
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deletingRunId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingRunId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Shuffle Run</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this shuffle run? This will
                            permanently delete the shuffle and all associated data. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingRunId && handleDelete(deletingRunId)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
