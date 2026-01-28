/** @format */

import { useMemo } from "react";
import { CalendarDays, CalendarCheck } from "lucide-react";
import { db } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface AttendanceWidgetProps {
    classId: string;
    studentId: string;
}

type AttendanceRecord = InstaQLEntity<
    AppSchema,
    "attendance_records",
    {
        class: {};
        student: {};
    }
>;

type AttendanceRecordsQueryResult = {
    attendance_records: AttendanceRecord[];
};

export function AttendanceWidget({ classId, studentId }: AttendanceWidgetProps) {
    // Query all attendance records for the student in this class
    const { data: attendanceData } = db.useQuery(
        studentId && classId
            ? {
                  attendance_records: {
                      $: {
                          where: {
                              and: [
                                  { "student.id": studentId },
                                  { "class.id": classId },
                              ],
                          },
                          order: { date: "desc" as const },
                      },
                      class: {},
                      student: {},
                  },
              }
            : null
    );

    const typedAttendanceData = (attendanceData as AttendanceRecordsQueryResult | undefined) ?? null;
    const classRecords = typedAttendanceData?.attendance_records ?? [];

    // Calculate statistics
    const stats = useMemo(() => {
        const total = classRecords.length;
        const present = classRecords.filter((r) => r.status === "present").length;
        const late = classRecords.filter((r) => r.status === "late").length;
        const absent = classRecords.filter((r) => r.status === "absent").length;

        // Attendance percentage: (present + late) / total * 100
        // Late counts as present because student was there, just late
        const attendancePercentage =
            total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        return {
            total,
            present,
            late,
            absent,
            attendancePercentage,
        };
    }, [classRecords]);

    // Filter to only late and absent records for history
    const lateAbsentRecords = useMemo(() => {
        return classRecords
            .filter((record) => record.status === "late" || record.status === "absent")
            .map((record) => ({
                recordId: record.id,
                date: record.date,
                status: record.status as "late" | "absent",
            }));
    }, [classRecords]);

    // Format date with day name
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Card style={{ backgroundColor: "var(--student-card-bg)" }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    Attendance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistics */}
                <div className="flex items-center justify-center gap-3 md:gap-6 pt-2 border-t">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold">
                            {stats.attendancePercentage}%
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">
                            Attendance
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-green-600 dark:text-green-500">
                            {stats.present}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">Present</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-amber-600 dark:text-amber-500">
                            {stats.late}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">Late</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl md:text-3xl font-semibold text-red-600 dark:text-red-500">
                            {stats.absent}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground">Absent</span>
                    </div>
                </div>

                {/* Late & Absent History */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Late & Absent History</h3>
                    <ScrollArea className="h-[300px] md:h-[400px]">
                        <div className="pr-4 space-y-2">
                            {lateAbsentRecords.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <CalendarCheck className="size-12 mx-auto mb-2 opacity-50" />
                                    <p>No late or absent records</p>
                                </div>
                            ) : (
                                lateAbsentRecords.map((entry) => (
                                    <Card
                                        key={entry.recordId}
                                        className="p-3"
                                        style={{ backgroundColor: "var(--student-card-bg)" }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-sm">
                                                    {formatDate(entry.date)}
                                                </span>
                                            </div>
                                            <Badge
                                                variant={
                                                    entry.status === "late" ? "outline" : "destructive"
                                                }
                                                className={
                                                    entry.status === "late"
                                                        ? "border-amber-500 text-amber-700 dark:text-amber-400"
                                                        : ""
                                                }
                                            >
                                                {entry.status === "late" ? "Late" : "Absent"}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
