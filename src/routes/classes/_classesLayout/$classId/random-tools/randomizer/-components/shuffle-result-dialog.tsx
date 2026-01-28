/** @format */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ShuffleResult } from "@/lib/randomizer/shuffler";
import { toggleStudentCompletion } from "@/lib/randomizer/shuffler";

interface ShuffleResultDialogProps {
    run: InstaQLEntity<AppSchema, "shuffler_runs", {}>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShuffleResultDialog({
    run,
    open,
    onOpenChange,
}: ShuffleResultDialogProps) {
    let results: ShuffleResult[] = [];
    try {
        results = JSON.parse(run.results);
    } catch (e) {
        console.error("Failed to parse shuffle results:", e);
    }

    const completedIds = useMemo(() => {
        if (!run.completedStudentIds) return [];
        try {
            return JSON.parse(run.completedStudentIds) as string[];
        } catch (e) {
            console.error("Failed to parse completed student IDs:", e);
            return [];
        }
    }, [run.completedStudentIds]);

    const [localCompletedIds, setLocalCompletedIds] = useState<string[]>(completedIds);

    // Sync local state when run changes
    useEffect(() => {
        setLocalCompletedIds(completedIds);
    }, [completedIds]);

    const handleToggleCompletion = async (studentId: string) => {
        const newCompletedIds = localCompletedIds.includes(studentId)
            ? localCompletedIds.filter((id) => id !== studentId)
            : [...localCompletedIds, studentId];
        
        setLocalCompletedIds(newCompletedIds);
        
        try {
            await toggleStudentCompletion(run.id, studentId, localCompletedIds);
        } catch (error) {
            console.error("Failed to toggle completion:", error);
            // Revert on error
            setLocalCompletedIds(localCompletedIds);
        }
    };

    const firstStudent = results[0];
    const lastStudent = results[results.length - 1];
    const displayName = run.name || new Date(run.runDate).toLocaleString();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{displayName}</DialogTitle>
                    <DialogDescription>
                        {new Date(run.runDate).toLocaleString()} - {run.scopeName}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        {firstStudent && (
                            <div className="flex-1 rounded-lg border p-3">
                                <div className="text-sm font-medium text-muted-foreground">
                                    First
                                </div>
                                <div className="text-lg font-semibold">
                                    {firstStudent.studentName}
                                </div>
                            </div>
                        )}
                        {lastStudent && (
                            <div className="flex-1 rounded-lg border p-3">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Last
                                </div>
                                <div className="text-lg font-semibold">
                                    {lastStudent.studentName}
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-medium mb-2">
                            Full Order: {localCompletedIds.length}/{results.length} completed
                        </div>
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                            <div className="space-y-2">
                                {results.map((result, index) => {
                                    const isCompleted = localCompletedIds.includes(result.studentId);
                                    return (
                                        <div
                                            key={result.studentId}
                                            className={`flex items-center gap-3 p-2 rounded hover:bg-muted ${
                                                isCompleted ? "opacity-60" : ""
                                            }`}
                                        >
                                            <Checkbox
                                                checked={isCompleted}
                                                onCheckedChange={() => handleToggleCompletion(result.studentId)}
                                            />
                                            <Badge variant="outline" className="w-12 justify-center">
                                                {result.position}
                                            </Badge>
                                            <span
                                                className={`flex-1 ${
                                                    isCompleted ? "line-through text-muted-foreground" : ""
                                                }`}
                                            >
                                                {result.studentName}
                                            </span>
                                            {isCompleted && (
                                                <CheckCircle2 className="size-4 text-green-600" />
                                            )}
                                            {index === 0 && !isCompleted && (
                                                <Badge variant="default">First</Badge>
                                            )}
                                            {index === results.length - 1 && !isCompleted && (
                                                <Badge variant="default">Last</Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
