/** @format */

import { useMemo } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { calculateDaysSince } from "./raz-utils";

type RazAssessmentWithRelations = InstaQLEntity<
    AppSchema,
    "raz_assessments",
    { student: {}; createdBy: {} }
>;

type ClassRosterEntry = InstaQLEntity<AppSchema, "class_roster", { student: {} }>;

interface RazDataTableProps {
    assessments: RazAssessmentWithRelations[];
    roster: ClassRosterEntry[];
}

export function RazDataTable({ assessments, roster }: RazDataTableProps) {
    // Create a map of roster entries by ID for quick lookup
    const rosterMap = useMemo(() => {
        const map = new Map<string, ClassRosterEntry>();
        roster.forEach((entry) => {
            map.set(entry.id, entry);
        });
        return map;
    }, [roster]);

    // Sort assessments by date (most recent first)
    const sortedAssessments = useMemo(() => {
        return [...assessments].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
    }, [assessments]);

    // Get result badge variant
    const getResultVariant = (
        result: string
    ): "destructive" | "default" | "secondary" => {
        switch (result) {
            case "level down":
                return "destructive";
            case "level up":
                return "default";
            default:
                return "secondary";
        }
    };

    if (assessments.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                        No RAZ assessments recorded yet. Go to the "Test Time" tab to record assessments.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Assessment History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead className="w-20">Level</TableHead>
                                <TableHead className="w-28">Result</TableHead>
                                <TableHead className="w-20 text-right">Accuracy</TableHead>
                                <TableHead className="w-20 text-right">Quiz</TableHead>
                                <TableHead className="w-20 text-right">Retelling</TableHead>
                                <TableHead className="w-24">Days Ago</TableHead>
                                <TableHead className="w-28">Date</TableHead>
                                <TableHead>Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAssessments.map((assessment) => {
                                // assessment.student is the roster entry (class_roster)
                                // Try to get from map first (has all relations), otherwise use assessment.student directly
                                const rosterEntry = assessment.student
                                    ? (rosterMap.get(assessment.student.id) || assessment.student)
                                    : null;
                                
                                // Use roster names if available, otherwise fall back to student account names
                                // rosterEntry.student is the user account ($users)
                                const student = (rosterEntry as ClassRosterEntry | null)?.student;
                                const firstName = rosterEntry?.firstName || student?.firstName;
                                const lastName = rosterEntry?.lastName || student?.lastName;
                                const studentName = [firstName, lastName]
                                    .filter(Boolean)
                                    .join(" ") || "Unknown";

                                const studentNumber = rosterEntry?.number;

                                const assessmentDate = new Date(assessment.date);

                                const daysSince = calculateDaysSince(assessmentDate);

                                return (
                                    <TableRow key={assessment.id}>
                                        <TableCell className="font-mono text-muted-foreground">
                                            {studentNumber ?? "—"}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {studentName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {assessment.level}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getResultVariant(
                                                    assessment.result
                                                )}
                                            >
                                                {assessment.result}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {assessment.accuracy != null
                                                ? `${assessment.accuracy}%`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {assessment.quizScore != null
                                                ? `${assessment.quizScore}%`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {assessment.retellingScore != null
                                                ? `${assessment.retellingScore}%`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {daysSince} day{daysSince === 1 ? "" : "s"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {assessmentDate.toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-muted-foreground">
                                            {assessment.note || "—"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
