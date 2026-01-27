/** @format */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, AlertTriangle, Clock, CalendarClock, CheckCircle, Info, AlertCircle, ExternalLink } from "lucide-react";
import { StudentAssessmentCard } from "./student-assessment-card";
import { CreateAssessmentDialog } from "./create-assessment-dialog";
import {
    getAssessmentStatus,
    checkRtiStatus,
    type UrgencyStatus,
    type StudentAssessmentStatus,
} from "./raz-utils";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type ClassRosterWithAssessments = InstaQLEntity<
    AppSchema,
    "class_roster",
    { razAssessments: {}; student: {} }
>;

interface TestTimeProps {
    classId: string;
    roster: ClassRosterWithAssessments[];
    userId: string;
}

interface ProcessedStudent {
    rosterId: string;
    studentId?: string;
    studentNumber?: number;
    firstName?: string;
    lastName?: string;
    currentLevel: string | null;
    lastTestDate: Date | null;
    lastResult: string | null;
    assessmentStatus: StudentAssessmentStatus;
    needsRti: boolean;
    rtiConsecutiveCount: number;
}

function getSectionIcon(status: UrgencyStatus) {
    switch (status) {
        case "overdue":
            return <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />;
        case "due-now":
            return <Clock className="size-5 text-orange-600 dark:text-orange-400" />;
        case "coming-soon":
            return <CalendarClock className="size-5 text-yellow-600 dark:text-yellow-400" />;
        case "up-to-date":
            return <CheckCircle className="size-5 text-green-600 dark:text-green-400" />;
    }
}

function getSectionTitle(status: UrgencyStatus): string {
    switch (status) {
        case "overdue":
            return "Overdue";
        case "due-now":
            return "Due Now";
        case "coming-soon":
            return "Coming Soon";
        case "up-to-date":
            return "Up to Date";
    }
}

function getSectionDescription(status: UrgencyStatus): string {
    switch (status) {
        case "overdue":
            return "These students have exceeded their recommended assessment window or had a 'level down' result.";
        case "due-now":
            return "These students are within their recommended assessment window and should be tested soon.";
        case "coming-soon":
            return "These students will be due for assessment within the next 7 days.";
        case "up-to-date":
            return "These students have been recently assessed and don't need testing yet.";
    }
}

function getSectionBgColor(status: UrgencyStatus): string {
    switch (status) {
        case "overdue":
            return "bg-red-50 dark:bg-red-950/30";
        case "due-now":
            return "bg-orange-50 dark:bg-orange-950/30";
        case "coming-soon":
            return "bg-yellow-50 dark:bg-yellow-950/30";
        case "up-to-date":
            return "bg-green-50 dark:bg-green-950/30";
    }
}

export function TestTime({ classId, roster, userId }: TestTimeProps) {
    const [expandedSections, setExpandedSections] = useState<Set<UrgencyStatus>>(
        new Set(["overdue", "due-now"])
    );
    const [selectedStudent, setSelectedStudent] = useState<ProcessedStudent | null>(
        null
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [razGuidelinesOpen, setRazGuidelinesOpen] = useState(false);

    // Process roster data to get assessment status for each student
    const processedStudents = useMemo(() => {
        return roster.map((entry): ProcessedStudent => {
            // Get the most recent assessment
            const assessments = entry.razAssessments ?? [];
            const sortedAssessments = [...assessments].sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            });

            const latestAssessment = sortedAssessments[0];

            const lastTestDate = latestAssessment?.date
                ? new Date(latestAssessment.date)
                : null;

            const currentLevel = latestAssessment?.level ?? null;
            const lastResult = latestAssessment?.result ?? null;

            const assessmentStatus = getAssessmentStatus(
                lastTestDate,
                lastResult,
                currentLevel
            );

            // Check RTI status
            const allAssessments = assessments.map((a) => ({
                result: a.result ?? "",
                date: new Date(a.date),
            }));
            const rtiStatus = checkRtiStatus(allAssessments);

            // Use roster names if available, otherwise fall back to student account names
            const firstName = entry.firstName || entry.student?.firstName || undefined;
            const lastName = entry.lastName || entry.student?.lastName || undefined;

            return {
                rosterId: entry.id,
                studentId: entry.student?.id,
                studentNumber: entry.number,
                firstName,
                lastName,
                currentLevel,
                lastTestDate,
                lastResult,
                assessmentStatus,
                needsRti: rtiStatus.needsRti,
                rtiConsecutiveCount: rtiStatus.consecutiveNonLevelUp,
            };
        });
    }, [roster]);

    // Group students by status
    const groupedStudents = useMemo(() => {
        const groups: Record<UrgencyStatus, ProcessedStudent[]> = {
            overdue: [],
            "due-now": [],
            "coming-soon": [],
            "up-to-date": [],
        };

        processedStudents.forEach((student) => {
            groups[student.assessmentStatus.status].push(student);
        });

        // Sort each group by overdueBy (most urgent first)
        Object.values(groups).forEach((group) => {
            group.sort((a, b) => b.assessmentStatus.overdueBy - a.assessmentStatus.overdueBy);
        });

        return groups;
    }, [processedStudents]);

    // Calculate summary counts
    const counts = useMemo(() => ({
        overdue: groupedStudents.overdue.length,
        "due-now": groupedStudents["due-now"].length,
        "coming-soon": groupedStudents["coming-soon"].length,
        "up-to-date": groupedStudents["up-to-date"].length,
        total: processedStudents.length,
        needsAssessment:
            groupedStudents.overdue.length + groupedStudents["due-now"].length,
        needsRti: processedStudents.filter((s) => s.needsRti).length,
    }), [groupedStudents, processedStudents]);

    const toggleSection = (status: UrgencyStatus) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(status)) {
                next.delete(status);
            } else {
                next.add(status);
            }
            return next;
        });
    };

    const handleAssess = (student: ProcessedStudent) => {
        setSelectedStudent(student);
        setDialogOpen(true);
    };

    const sections: UrgencyStatus[] = ["overdue", "due-now", "coming-soon", "up-to-date"];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <SummaryCard
                    status="overdue"
                    count={counts.overdue}
                    total={counts.total}
                />
                <SummaryCard
                    status="due-now"
                    count={counts["due-now"]}
                    total={counts.total}
                />
                <SummaryCard
                    status="coming-soon"
                    count={counts["coming-soon"]}
                    total={counts.total}
                />
                <SummaryCard
                    status="up-to-date"
                    count={counts["up-to-date"]}
                    total={counts.total}
                />
                <RtiSummaryCard count={counts.needsRti} total={counts.total} />
            </div>

            {/* RAZ Guidelines Info */}
            <div className="flex justify-center">
                <Collapsible className="group/collapsible w-full max-w-2xl" open={razGuidelinesOpen} onOpenChange={setRazGuidelinesOpen}>
                    <Card className="w-full">
                        <CollapsibleTrigger className="w-full">
                            <CardContent className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">
                                        Assessment Status Guidelines
                                    </span>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </CardContent>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground">
                                    All of the above assessment statuses (overdue, due now, coming soon, up to date, and RTI review) are based on{" "}
                                    <a
                                        href="https://www.raz-plus.com/learninga-z-levels/assessing-a-students-level/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        RAZ Guidelines
                                        <ExternalLink className="size-3" />
                                    </a>
                                    .
                                </p>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            </div>

            {/* Assessment needed banner */}
            {counts.needsAssessment > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-sm">
                        <span className="font-medium">
                            {counts.needsAssessment} student
                            {counts.needsAssessment === 1 ? "" : "s"}
                        </span>{" "}
                        need{counts.needsAssessment === 1 ? "s" : ""} an assessment.
                        Click on a student card to record their assessment.
                    </span>
                </div>
            )}

            {/* Collapsible Sections */}
            <div className="space-y-4">
                {sections.map((status) => {
                    const students = groupedStudents[status];
                    const isExpanded = expandedSections.has(status);
                    const count = students.length;

                    if (count === 0) return null;

                    return (
                        <Collapsible
                            key={status}
                            open={isExpanded}
                            onOpenChange={() => toggleSection(status)}
                        >
                            <Card className={getSectionBgColor(status)}>
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-xl py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {getSectionIcon(status)}
                                                <CardTitle className="text-base font-medium">
                                                    {getSectionTitle(status)}
                                                </CardTitle>
                                                <Badge variant="secondary">
                                                    {count}
                                                </Badge>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="size-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="max-w-xs">
                                                        {getSectionDescription(status)}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronDown className="size-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="size-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="pt-0 pb-4">
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {students.map((student) => (
                                                <StudentAssessmentCard
                                                    key={student.rosterId}
                                                    studentId={student.rosterId}
                                                    studentNumber={student.studentNumber}
                                                    firstName={student.firstName}
                                                    lastName={student.lastName}
                                                    level={student.currentLevel}
                                                    lastTestDate={student.lastTestDate}
                                                    lastResult={student.lastResult}
                                                    assessmentStatus={student.assessmentStatus}
                                                    needsRti={student.needsRti}
                                                    rtiConsecutiveCount={student.rtiConsecutiveCount}
                                                    onAssess={() => handleAssess(student)}
                                                />
                                            ))}
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    );
                })}
            </div>

            {/* Empty state */}
            {counts.total === 0 && (
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                        No students found in this class roster.
                    </p>
                </Card>
            )}

            {/* Assessment Dialog */}
            <CreateAssessmentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                classId={classId}
                student={
                    selectedStudent
                        ? {
                              rosterId: selectedStudent.rosterId,
                              studentNumber: selectedStudent.studentNumber,
                              firstName: selectedStudent.firstName,
                              lastName: selectedStudent.lastName,
                              currentLevel: selectedStudent.currentLevel ?? undefined,
                          }
                        : null
                }
                userId={userId}
            />
        </div>
    );
}

interface SummaryCardProps {
    status: UrgencyStatus;
    count: number;
    total: number;
}

function SummaryCard({ status, count, total }: SummaryCardProps) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <Card className={`${getSectionBgColor(status)} border`}>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    {getSectionIcon(status)}
                    <span className="text-sm font-medium text-muted-foreground">
                        {getSectionTitle(status)}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{count}</span>
                    <span className="text-sm text-muted-foreground">
                        ({percentage}%)
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

interface RtiSummaryCardProps {
    count: number;
    total: number;
}

function RtiSummaryCard({ count, total }: RtiSummaryCardProps) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <Card className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="size-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-muted-foreground">
                        RTI Review
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{count}</span>
                    <span className="text-sm text-muted-foreground">
                        ({percentage}%)
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
