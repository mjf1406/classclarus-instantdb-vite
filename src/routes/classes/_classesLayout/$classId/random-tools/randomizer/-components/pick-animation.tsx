/** @format */

import { useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hand } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface PickAnimationProps {
    student: InstaQLEntity<AppSchema, "$users">;
    availableStudents: InstaQLEntity<AppSchema, "$users">[];
    onClose: () => void;
    getStudentName?: (studentId: string) => string;
}

export function PickAnimation({
    student,
    availableStudents,
    onClose,
    getStudentName,
}: PickAnimationProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const totalDuration = 3000; // 3 seconds

    useEffect(() => {
        if (availableStudents.length === 0) {
            setShowResult(true);
            return;
        }

        // Find the index of the picked student
        const pickedIndex = availableStudents.findIndex((s) => s.id === student.id);
        const targetIndex = pickedIndex >= 0 ? pickedIndex : 0;

        // Start cycling through students
        const startTime = Date.now();
        startTimeRef.current = startTime;

        const cycle = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            if (progress >= 1) {
                // Animation complete - show the result
                setCurrentIndex(targetIndex);
                setShowResult(true);
                return;
            }

            // Calculate delay: starts fast (10ms), ends slow (200ms)
            // Using an easing function for smooth deceleration
            const minDelay = 10;
            const maxDelay = 200;
            // Ease-out cubic: starts fast, ends slow
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const delay = minDelay + (maxDelay - minDelay) * easedProgress;

            // Cycle to next student
            setCurrentIndex((prev) => {
                // Cycle through all students, but ensure we end on the target
                // As we get closer to the end, bias toward the target
                const remainingTime = totalDuration - elapsed;
                const shouldBiasToTarget = remainingTime < 500; // Last 500ms

                if (shouldBiasToTarget && Math.random() > 0.3) {
                    // 70% chance to show target in last 500ms
                    return targetIndex;
                }

                // Otherwise cycle normally
                return (prev + 1) % availableStudents.length;
            });

            // Schedule next cycle
            intervalRef.current = setTimeout(cycle, delay);
        };

        // Start the cycle
        cycle();

        return () => {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
        };
    }, [availableStudents, student.id, onClose]);

    const currentStudent = availableStudents[currentIndex] || student;
    const studentName =
        getStudentName?.(currentStudent.id) ||
        `${currentStudent.firstName || ""} ${currentStudent.lastName || ""}`.trim() ||
        currentStudent.email ||
        "Unknown Student";

    return (
        <Dialog open={true} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <DialogContent className="max-w-md">
                <DialogTitle className="sr-only">
                    {showResult ? `Selected: ${studentName}` : "Picking a student"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    {showResult
                        ? `The randomly selected student is ${studentName}`
                        : "Please wait while we randomly select a student"}
                </DialogDescription>
                <div className="flex flex-col items-center justify-center py-8">
                    {!showResult ? (
                        <>
                            <Hand className="size-16 text-primary animate-pulse mb-4" />
                            <p className="text-lg font-medium transition-all duration-75">
                                {studentName}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">Picking...</p>
                        </>
                    ) : (
                        <>
                            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Hand className="size-10 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">Selected:</p>
                            <p className="text-2xl font-bold text-center">{studentName}</p>
                        </>
                    )}
                </div>
                {showResult && (
                    <DialogFooter>
                        <Button onClick={onClose} className="w-full">
                            Close
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
