/** @format */

import { CalendarCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export function AttendancePageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarCheck className="size-12 md:size-16 text-primary" />
                    <div>
                        <Skeleton className="h-7 md:h-8 lg:h-9 w-32 mb-2" />
                        <Skeleton className="h-4 md:h-5 w-64" />
                    </div>
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-6">
                <div className="space-y-2">
                    <Label>Group</Label>
                    <div className="flex flex-wrap gap-3">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </div>
            </div>

            {/* Summary Bar */}
            <Skeleton className="h-12 w-full" />

            {/* Cards Grid */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] lg:h-[120px]" />
                ))}
            </div>
        </div>
    );
}
