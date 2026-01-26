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
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ShuffleResult } from "@/lib/randomizer/shuffler";

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

    const firstStudent = results[0];
    const lastStudent = results[results.length - 1];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Shuffle Details</DialogTitle>
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
                        <div className="text-sm font-medium mb-2">Full Order:</div>
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                            <div className="space-y-2">
                                {results.map((result, index) => (
                                    <div
                                        key={result.studentId}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                                    >
                                        <Badge variant="outline" className="w-12 justify-center">
                                            {result.position}
                                        </Badge>
                                        <span className="flex-1">{result.studentName}</span>
                                        {index === 0 && (
                                            <Badge variant="default">First</Badge>
                                        )}
                                        {index === results.length - 1 && (
                                            <Badge variant="default">Last</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
