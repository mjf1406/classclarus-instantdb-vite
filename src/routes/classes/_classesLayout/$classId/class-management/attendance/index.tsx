/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { CalendarCheck, Users, ChevronLeft, ChevronRight, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById, type ClassByRole } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { useClassRoster } from "@/hooks/use-class-roster";
import { db } from "@/lib/db/db";
import { id } from "@instantdb/react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { AttendanceStudentCard } from "./-components/attendance-student-card";
import { AttendancePageSkeleton } from "./-components/attendance-page-skeleton";

const ALL_VALUE = "__all__";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/class-management/attendance/"
)({
    component: RouteComponent,
});

type ClassForAttendance = InstaQLEntity<
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
        attendanceRecords?: { student: {}; createdBy: {} };
    }
>;

type AttendanceQueryResult = { classes: ClassForAttendance[] };

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity } = useClassById(classId);

    // Get today's date in YYYY-MM-DD format
    const getTodayDateString = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
    const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_VALUE);
    const [selectedTeamId, setSelectedTeamId] = useState<string>(ALL_VALUE);

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
                          $: { where: { date: selectedDate } },
                          student: {},
                          createdBy: {},
                      },
                  },
              }
            : null
    );

    const typedData = (data as AttendanceQueryResult | undefined) ?? null;
    const classEntityWithRelations = typedData?.classes?.[0] || classEntity;
    const roleInfo = useClassRole(classEntityWithRelations as ClassByRole | undefined);

    // Show skeleton while data is loading
    if (dataLoading) {
        return <AttendancePageSkeleton />;
    }

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={!classEntity && classId !== null}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <AttendancePageContent
                classEntity={classEntityWithRelations}
                classId={classId ?? ""}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedGroupId={selectedGroupId}
                onGroupChange={setSelectedGroupId}
                selectedTeamId={selectedTeamId}
                onTeamChange={setSelectedTeamId}
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

interface AttendancePageContentProps {
    classEntity: ClassForAttendance | undefined;
    classId: string;
    selectedDate: string;
    onDateChange: (date: string) => void;
    selectedGroupId: string;
    onGroupChange: (groupId: string) => void;
    selectedTeamId: string;
    onTeamChange: (teamId: string) => void;
    canManage: boolean;
}

function AttendancePageContent({
    classEntity,
    classId,
    selectedDate,
    onDateChange,
    selectedGroupId,
    onGroupChange,
    selectedTeamId,
    onTeamChange,
    canManage,
}: AttendancePageContentProps) {
    const { getRosterForStudent } = useClassRoster(classId);
    const { user } = db.useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Get today's date in YYYY-MM-DD format
    const getTodayDateString = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const groups = classEntity?.groups ?? [];
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);
    const teams = selectedGroup?.groupTeams ?? [];
    const attendanceRecords = classEntity?.attendanceRecords ?? [];

    // Create a map of student ID to attendance status
    const attendanceMap = useMemo(() => {
        const map = new Map<string, "present" | "late" | "absent">();
        for (const record of attendanceRecords) {
            if (record.student?.id && record.status) {
                map.set(record.student.id, record.status as "present" | "late" | "absent");
            }
        }
        return map;
    }, [attendanceRecords]);

    // Reset team when group changes
    useEffect(() => {
        onTeamChange(ALL_VALUE);
    }, [selectedGroupId, onTeamChange]);

    // Reset button states when date changes
    useEffect(() => {
        setIsSubmitting(false);
        setIsSubmitted(false);
    }, [selectedDate]);

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

    // Calculate summary counts
    const summary = useMemo(() => {
        let present = 0;
        let late = 0;
        let absent = 0;

        for (const student of filteredStudents) {
            const status = attendanceMap.get(student.id);
            if (!status || status === "present") {
                present++;
            } else if (status === "late") {
                late++;
            } else {
                absent++;
            }
        }

        return { present, late, absent, total: filteredStudents.length };
    }, [filteredStudents, attendanceMap]);

    // Check if all students have attendance records
    const hasUnsavedAttendance = useMemo(() => {
        if (filteredStudents.length === 0) return false;
        return filteredStudents.some(
            (student) => !attendanceMap.has(student.id)
        );
    }, [filteredStudents, attendanceMap]);

    const handleStatusChange = (
        studentId: string,
        status: "present" | "late" | "absent"
    ) => {
        if (!user || !canManage) return;

        // Find existing record for this student and date
        const existingRecord = attendanceRecords.find(
            (r) => r.student?.id === studentId && r.date === selectedDate
        );

        const now = new Date();

        if (existingRecord) {
            // Update existing record
            db.transact([
                db.tx.attendance_records[existingRecord.id].update({
                    status,
                    updatedAt: now,
                }),
            ]);
        } else {
            // Create new record
            const recordId = id();
            db.transact([
                db.tx.attendance_records[recordId]
                    .create({
                        date: selectedDate,
                        status,
                        createdAt: now,
                        updatedAt: now,
                    })
                    .link({ class: classId })
                    .link({ student: studentId })
                    .link({ createdBy: user.id }),
            ]);
        }
    };

    const handleMarkAllPresent = () => {
        if (!user || !canManage) return;

        const now = new Date();
        const transactions: any[] = [];

        for (const student of filteredStudents) {
            const existingRecord = attendanceRecords.find(
                (r) => r.student?.id === student.id && r.date === selectedDate
            );

            if (existingRecord) {
                transactions.push(
                    db.tx.attendance_records[existingRecord.id].update({
                        status: "present",
                        updatedAt: now,
                    })
                );
            } else {
                const recordId = id();
                transactions.push(
                    db.tx.attendance_records[recordId]
                        .create({
                            date: selectedDate,
                            status: "present",
                            createdAt: now,
                            updatedAt: now,
                        })
                        .link({ class: classId })
                        .link({ student: student.id })
                        .link({ createdBy: user.id })
                );
            }
        }

        if (transactions.length > 0) {
            db.transact(transactions);
        }
    };

    const handleSubmitAttendance = () => {
        if (!user || !canManage || isSubmitting) return;

        setIsSubmitting(true);
        setIsSubmitted(false);

        const now = new Date();
        const transactions: any[] = [];

        for (const student of filteredStudents) {
            const existingRecord = attendanceRecords.find(
                (r) => r.student?.id === student.id && r.date === selectedDate
            );
            // Get current status from map, default to "present" if not set
            const currentStatus = attendanceMap.get(student.id) ?? "present";

            if (existingRecord) {
                // Only update if status differs
                if (existingRecord.status !== currentStatus) {
                    transactions.push(
                        db.tx.attendance_records[existingRecord.id].update({
                            status: currentStatus,
                            updatedAt: now,
                        })
                    );
                }
            } else {
                // Create new record (including "present" students)
                const recordId = id();
                transactions.push(
                    db.tx.attendance_records[recordId]
                        .create({
                            date: selectedDate,
                            status: currentStatus,
                            createdAt: now,
                            updatedAt: now,
                        })
                        .link({ class: classId })
                        .link({ student: student.id })
                        .link({ createdBy: user.id })
                );
            }
        }

        if (transactions.length > 0) {
            db.transact(transactions);
        }

        // Brief delay to show loading, then success
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            // Reset success state after 2 seconds
            setTimeout(() => {
                setIsSubmitted(false);
            }, 2000);
        }, 300);
    };

    const handlePreviousDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        onDateChange(date.toISOString().split("T")[0]);
    };

    const handleNextDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        onDateChange(date.toISOString().split("T")[0]);
    };

    const handleToday = () => {
        onDateChange(getTodayDateString());
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <CalendarCheck className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Attendance
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Manage attendance for your class
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePreviousDay}
                            aria-label="Previous day"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="w-auto"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextDay}
                            aria-label="Next day"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleToday}
                            className="ml-1"
                        >
                            Today
                        </Button>
                    </div>
                    {canManage && (
                        <>
                            <Button onClick={handleMarkAllPresent} variant="outline">
                                Mark All Present
                            </Button>
                            <Button 
                                onClick={handleSubmitAttendance}
                                disabled={isSubmitting || isSubmitted}
                                className="min-w-[160px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : isSubmitted ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Saved!
                                    </>
                                ) : (
                                    "Submit Attendance"
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Date Display */}
            <div className="flex justify-center">
                <h2 className="text-2xl md:text-3xl font-semibold">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </h2>
            </div>

            {/* Summary Bar */}
            <Card>
                <CardContent className="py-3">
                    <div className="flex items-center justify-center gap-6 flex-wrap">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {summary.present}
                            </div>
                            <div className="text-sm text-muted-foreground">Present</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600">
                                {summary.late}
                            </div>
                            <div className="text-sm text-muted-foreground">Late</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {summary.absent}
                            </div>
                            <div className="text-sm text-muted-foreground">Absent</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {summary.total}
                            </div>
                            <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Unsaved Attendance Indicator */}
            {hasUnsavedAttendance && canManage && (
                <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        Some students don't have attendance records saved yet. Click "Submit Attendance" to save all changes.
                    </AlertDescription>
                </Alert>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-6">
                <div className="space-y-2">
                    <Label>Group</Label>
                    <RadioGroup
                        value={selectedGroupId}
                        onValueChange={onGroupChange}
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
                            onValueChange={onTeamChange}
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
                        const attendanceStatus = attendanceMap.get(student.id);
                        return (
                            <AttendanceStudentCard
                                key={student.id}
                                student={student}
                                existingRoster={getRosterForStudent(student.id)}
                                attendanceStatus={attendanceStatus}
                                onStatusChange={(status) =>
                                    handleStatusChange(student.id, status)
                                }
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
