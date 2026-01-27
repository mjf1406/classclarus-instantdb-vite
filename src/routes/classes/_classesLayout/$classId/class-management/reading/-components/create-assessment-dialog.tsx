/** @format */

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import {
    Credenza,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RAZ_LEVELS_EXTENDED, RESULT_OPTIONS, getScoreRecommendation } from "./raz-utils";
import type { ResultOption } from "./raz-utils";

interface StudentInfo {
    rosterId: string;
    studentNumber?: number;
    firstName?: string;
    lastName?: string;
    currentLevel?: string;
}

interface CreateAssessmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: string;
    student: StudentInfo | null;
    userId: string;
}

export function CreateAssessmentDialog({
    open,
    onOpenChange,
    classId,
    student,
    userId,
}: CreateAssessmentDialogProps) {
    const [level, setLevel] = useState<string>("");
    const [result, setResult] = useState<ResultOption | "">("");
    const [accuracy, setAccuracy] = useState<string>("");
    const [quizScore, setQuizScore] = useState<string>("");
    const [retellingScore, setRetellingScore] = useState<string>("");
    const [note, setNote] = useState("");
    const [date, setDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split("T")[0];
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendationMessage, setRecommendationMessage] = useState<string>("");

    // Reset form when dialog opens with new student
    useEffect(() => {
        if (open && student) {
            // Pre-fill level if student has a current level
            if (student.currentLevel) {
                // Handle "aa" level (lowercase) or uppercase levels
                const normalizedLevel =
                    student.currentLevel.toLowerCase() === "aa"
                        ? "aa"
                        : student.currentLevel.toUpperCase();
                if (RAZ_LEVELS_EXTENDED.includes(normalizedLevel)) {
                    setLevel(normalizedLevel);
                } else {
                    setLevel(normalizedLevel);
                }
            } else {
                setLevel("");
            }
            setResult("");
            setAccuracy("");
            setQuizScore("");
            setRetellingScore("");
            setNote("");
            setDate(new Date().toISOString().split("T")[0]);
            setError(null);
            setRecommendationMessage("");
        }
    }, [open, student]);

    // Auto-compute and apply recommendation when accuracy or quiz score changes
    useEffect(() => {
        const accuracyNum = accuracy ? parseFloat(accuracy) : NaN;
        const quizNum = quizScore ? parseFloat(quizScore) : NaN;

        // Only compute recommendation if both scores are provided and valid
        if (
            !isNaN(accuracyNum) &&
            !isNaN(quizNum) &&
            accuracyNum > 0 &&
            quizNum >= 0 &&
            student?.currentLevel
        ) {
            const recommendation = getScoreRecommendation(
                accuracyNum,
                quizNum,
                student.currentLevel
            );

            // Auto-apply recommendation
            setResult(recommendation.result);
            setLevel(recommendation.level);
            setRecommendationMessage(recommendation.message);
        } else if (!accuracy && !quizScore) {
            // Clear recommendation if scores are cleared
            setRecommendationMessage("");
        }
    }, [accuracy, quizScore, student?.currentLevel]);

    const displayName = student
        ? [student.firstName, student.lastName].filter(Boolean).join(" ") ||
          "Unknown Student"
        : "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!student) {
            setError("No student selected");
            return;
        }

        if (!level) {
            setError("Please select a reading level");
            return;
        }

        if (!result) {
            setError("Please select a result");
            return;
        }

        setIsSubmitting(true);

        try {
            const assessmentId = id();
            const now = new Date();
            const assessmentDate = new Date(date);

            // Parse optional number fields
            const accuracyNum = accuracy ? parseFloat(accuracy) : undefined;
            const quizNum = quizScore ? parseFloat(quizScore) : undefined;
            const retellingNum = retellingScore
                ? parseFloat(retellingScore)
                : undefined;

            // Validate number ranges
            if (
                accuracyNum !== undefined &&
                (accuracyNum < 0 || accuracyNum > 100)
            ) {
                setError("Accuracy must be between 0 and 100");
                setIsSubmitting(false);
                return;
            }
            if (quizNum !== undefined && (quizNum < 0 || quizNum > 5)) {
                setError("Quiz score must be between 0 and 5");
                setIsSubmitting(false);
                return;
            }
            if (
                retellingNum !== undefined &&
                (retellingNum < 0 || retellingNum > 100)
            ) {
                setError("Retelling score must be between 0 and 100");
                setIsSubmitting(false);
                return;
            }

            const transactions = [
                db.tx.raz_assessments[assessmentId].create({
                    date: assessmentDate,
                    level: level,
                    result: result,
                    accuracy: accuracyNum,
                    quizScore: quizNum,
                    retellingScore: retellingNum,
                    note: note.trim() || undefined,
                    createdAt: now,
                }),
                db.tx.raz_assessments[assessmentId].link({ class: classId }),
                db.tx.raz_assessments[assessmentId].link({
                    student: student.rosterId,
                }),
                db.tx.raz_assessments[assessmentId].link({ createdBy: userId }),
            ];

            await db.transact(transactions);

            onOpenChange(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create assessment"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <CredenzaHeader>
                        <CredenzaTitle>Record RAZ Assessment</CredenzaTitle>
                        <CredenzaDescription>
                            {student && (
                                <>
                                    Recording assessment for{" "}
                                    <span className="font-medium">
                                        {displayName}
                                    </span>
                                    {student.studentNumber && (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            (#{student.studentNumber})
                                        </span>
                                    )}
                                    {student.currentLevel && (
                                        <>
                                            <br />
                                            <span className="text-muted-foreground">
                                                Current Level: {student.currentLevel.toUpperCase()}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </CredenzaDescription>
                    </CredenzaHeader>

                    <CredenzaBody className="space-y-4">
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Accuracy and Quiz Score */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Accuracy */}
                            <div className="space-y-2">
                                <Label htmlFor="accuracy">Running Record Accuracy Rate (%)</Label>
                                <div className="text-xs text-muted-foreground">
                                    Input the accuracy percentage without the % symbol.
                                </div>
                                <NumberInput
                                    id="accuracy"
                                    value={accuracy}
                                    onChange={setAccuracy}
                                    min={0}
                                    max={100}
                                    step={1}
                                    placeholder="0-100"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Quiz Score */}
                            <div className="space-y-2">
                                <Label htmlFor="quiz">Quick Check Comprehension Quiz Score (0-5)</Label>
                                <div className="text-xs text-muted-foreground">
                                    Input the number of questions answered correctly.
                                </div>
                                <NumberInput
                                    id="quiz"
                                    value={quizScore}
                                    onChange={setQuizScore}
                                    min={0}
                                    max={5}
                                    step={1}
                                    placeholder="0-5"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Recommendation Banner */}
                        <div className="rounded border border-blue-300 bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 min-h-[3rem] flex items-center">
                            {recommendationMessage ? (
                                <div dangerouslySetInnerHTML={{ __html: recommendationMessage }} />
                            ) : (
                                <div className="text-muted-foreground italic">
                                    Level adjustment recommendation will appear here after inputting running record and quick check scores.
                                </div>
                            )}
                        </div>

                        {/* Level and Result */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Level */}
                            <div className="space-y-2">
                                <Label htmlFor="level">Level *</Label>
                                <Select
                                    value={level}
                                    onValueChange={setLevel}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger id="level">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RAZ_LEVELS_EXTENDED.map((l) => (
                                            <SelectItem key={l} value={l}>
                                                {l}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Result */}
                            <div className="space-y-2">
                                <Label htmlFor="result">Result *</Label>
                                <Select
                                    value={result}
                                    onValueChange={(v) =>
                                        setResult(v as ResultOption)
                                    }
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger id="result">
                                        <SelectValue placeholder="Select result" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RESULT_OPTIONS.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r.charAt(0).toUpperCase() +
                                                    r.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Retelling Score */}
                        <div className="space-y-2">
                            <Label htmlFor="retelling">Retelling Score</Label>
                            <NumberInput
                                id="retelling"
                                value={retellingScore}
                                onChange={setRetellingScore}
                                min={0}
                                max={100}
                                step={1}
                                placeholder="0-100"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <Label htmlFor="note">Note (optional)</Label>
                            <Textarea
                                id="note"
                                placeholder="Add any observations or notes..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={isSubmitting}
                                rows={3}
                            />
                        </div>
                    </CredenzaBody>

                    <CredenzaFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Assessment"}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
