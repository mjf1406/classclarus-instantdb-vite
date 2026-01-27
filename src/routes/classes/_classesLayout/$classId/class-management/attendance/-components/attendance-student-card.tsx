/** @format */

import { Card, CardContent } from "@/components/ui/card";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { RosterEntry } from "@/hooks/use-class-roster";

interface AttendanceStudentCardProps {
    student: InstaQLEntity<AppSchema, "$users">;
    existingRoster: RosterEntry | null;
    attendanceStatus: "present" | "late" | "absent" | undefined;
    onStatusChange: (status: "present" | "late" | "absent") => void;
}

export function AttendanceStudentCard({
    student,
    existingRoster,
    attendanceStatus,
    onStatusChange,
}: AttendanceStudentCardProps) {
    const rosterNumber = existingRoster?.number;
    const firstName =
        (existingRoster?.firstName ?? student.firstName)?.trim() || "—";
    const gender =
        (existingRoster?.gender ?? student.gender)?.trim() || "—";

    // Determine background color based on status
    const getStatusColor = () => {
        if (!attendanceStatus || attendanceStatus === "present") {
            return "bg-green-100/50 dark:bg-green-900/20";
        }
        if (attendanceStatus === "late") {
            return "bg-amber-100 dark:bg-amber-900/20";
        }
        return "bg-red-200 dark:bg-red-900/30";
    };

    const getStatusText = () => {
        if (!attendanceStatus || attendanceStatus === "present") {
            return "Present";
        }
        if (attendanceStatus === "late") {
            return "Late";
        }
        return "Absent";
    };

    const cycleStatus = () => {
        if (!attendanceStatus || attendanceStatus === "present") {
            onStatusChange("late");
        } else if (attendanceStatus === "late") {
            onStatusChange("absent");
        } else {
            onStatusChange("present");
        }
    };

    return (
        <Card
            className={`relative min-h-[80px] lg:min-h-[120px] py-1 cursor-pointer transition-colors ${getStatusColor()}`}
            onClick={cycleStatus}
        >
            <CardContent className="flex flex-col p-1 lg:p-2">
                {/* Upper row: number (left), status badge (right) */}
                <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] shrink-0 text-muted-foreground lg:text-xs">
                        {rosterNumber !== undefined && rosterNumber !== null
                            ? `#${rosterNumber}`
                            : "—"}
                    </span>
                    <span
                        className={`rounded px-1 py-0.5 text-[10px] font-medium leading-tight lg:px-2 lg:text-sm ${
                            !attendanceStatus || attendanceStatus === "present"
                                ? "bg-green-500 text-white"
                                : attendanceStatus === "late"
                                  ? "bg-amber-500 text-white"
                                  : "bg-red-500 text-white"
                        }`}
                    >
                        {getStatusText()}
                    </span>
                </div>

                {/* Center: first name and gender */}
                <div className="flex flex-1 flex-col items-center justify-center overflow-hidden py-1 lg:py-2">
                    <div className="truncate text-center text-xs font-medium w-full lg:text-base">
                        {firstName}
                    </div>
                    <div className="text-center text-[10px] text-muted-foreground lg:text-xs">
                        {gender}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
