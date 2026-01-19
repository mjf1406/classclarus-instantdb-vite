/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { validateStudentExpectationValue } from "@/lib/expectation-validation";
import { formatExpectationValue, formatExpectationRange } from "@/lib/format-expectation-value";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Expectation = InstaQLEntity<AppSchema, "expectations">;
type StudentExpectation = InstaQLEntity<
    AppSchema,
    "student_expectations",
    { expectation?: {}; student?: {}; class?: {} }
>;

interface EditableExpectationCellProps {
    studentId: string;
    expectation: Expectation;
    studentExpectation: StudentExpectation | null;
    classId: string;
    canManage: boolean;
}

export function EditableExpectationCell({
    studentId,
    expectation,
    studentExpectation,
    classId,
    canManage,
}: EditableExpectationCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState<string>("");
    const [minValue, setMinValue] = useState<string>("");
    const [maxValue, setMaxValue] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartEdit = () => {
        if (!canManage) return;
        setIsEditing(true);
        if (expectation.inputType === "number") {
            setValue(
                studentExpectation?.value != null
                    ? String(studentExpectation.value)
                    : ""
            );
        } else {
            setMinValue(
                studentExpectation?.minValue != null
                    ? String(studentExpectation.minValue)
                    : ""
            );
            setMaxValue(
                studentExpectation?.maxValue != null
                    ? String(studentExpectation.maxValue)
                    : ""
            );
        }
        setError(null);
    };

    const handleSave = async () => {
        setError(null);

        let parsedValue: number | undefined;
        let parsedMinValue: number | undefined;
        let parsedMaxValue: number | undefined;

        if (expectation.inputType === "number") {
            const trimmed = value.trim();
            parsedValue = trimmed === "" ? undefined : Number(trimmed);
            if (parsedValue !== undefined && Number.isNaN(parsedValue)) {
                setError("Value must be a valid number");
                return;
            }
        } else {
            const trimmedMin = minValue.trim();
            const trimmedMax = maxValue.trim();
            parsedMinValue =
                trimmedMin === "" ? undefined : Number(trimmedMin);
            parsedMaxValue =
                trimmedMax === "" ? undefined : Number(trimmedMax);
            if (
                parsedMinValue !== undefined &&
                Number.isNaN(parsedMinValue)
            ) {
                setError("Minimum value must be a valid number");
                return;
            }
            if (
                parsedMaxValue !== undefined &&
                Number.isNaN(parsedMaxValue)
            ) {
                setError("Maximum value must be a valid number");
                return;
            }
        }

        // Validate using utility
        const validationError = validateStudentExpectationValue(
            expectation,
            parsedValue,
            parsedMinValue,
            parsedMaxValue
        );
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSaving(true);

        try {
            const now = new Date();
            if (studentExpectation) {
                // Update existing
                const updateData: Record<string, unknown> = {
                    updated: now,
                };
                if (expectation.inputType === "number") {
                    updateData.value = parsedValue;
                    updateData.minValue = undefined;
                    updateData.maxValue = undefined;
                } else {
                    updateData.minValue = parsedMinValue;
                    updateData.maxValue = parsedMaxValue;
                    updateData.value = undefined;
                }
                db.transact([
                    db.tx.student_expectations[studentExpectation.id].update(
                        updateData
                    ),
                ]);
            } else {
                // Create new
                const studentExpectationId = id();
                const createData = {
                    created: now,
                    updated: now,
                    ...(expectation.inputType === "number"
                        ? { value: parsedValue }
                        : {
                              minValue: parsedMinValue,
                              maxValue: parsedMaxValue,
                          }),
                };
                db.transact([
                    db.tx.student_expectations[studentExpectationId].create(
                        createData
                    ),
                    db.tx.student_expectations[studentExpectationId].link({
                        expectation: expectation.id,
                    }),
                    db.tx.student_expectations[studentExpectationId].link({
                        student: studentId,
                    }),
                    db.tx.student_expectations[studentExpectationId].link({
                        class: classId,
                    }),
                ]);
            }
            setIsEditing(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save expectation"
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setValue("");
        setMinValue("");
        setMaxValue("");
        setError(null);
    };

    // Display mode
    if (!isEditing) {
        let displayText = "—";
        if (expectation.inputType === "number") {
            if (
                studentExpectation?.value != null &&
                !Number.isNaN(studentExpectation.value)
            ) {
                displayText = formatExpectationValue(
                    studentExpectation.value,
                    expectation.unit
                );
            }
        } else {
            if (
                studentExpectation?.minValue != null &&
                studentExpectation?.maxValue != null &&
                !Number.isNaN(studentExpectation.minValue) &&
                !Number.isNaN(studentExpectation.maxValue)
            ) {
                displayText = formatExpectationRange(
                    studentExpectation.minValue,
                    studentExpectation.maxValue,
                    expectation.unit
                );
            }
        }

        return (
            <span
                className={canManage ? "cursor-cell" : undefined}
                onDoubleClick={canManage ? handleStartEdit : undefined}
            >
                {displayText}
            </span>
        );
    }

    // Edit mode
    return (
        <div className="flex flex-col gap-1 min-w-0">
            {expectation.inputType === "number" ? (
                <div className="flex items-center gap-1 min-w-0">
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            else if (e.key === "Escape") handleCancel();
                        }}
                        autoFocus
                        className="h-8 flex-1 min-w-0"
                        placeholder="Enter value"
                        disabled={isSaving}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">
                        {expectation.unit}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={handleSave}
                        disabled={isSaving}
                        aria-label="Save"
                    >
                        <Check className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={handleCancel}
                        disabled={isSaving}
                        aria-label="Cancel"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="flex items-center gap-1 min-w-0">
                        <Input
                            type="number"
                            value={minValue}
                            onChange={(e) => setMinValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                                else if (e.key === "Escape") handleCancel();
                            }}
                            autoFocus
                            className="h-8 flex-1 min-w-0"
                            placeholder="Min"
                            disabled={isSaving}
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                            -
                        </span>
                        <Input
                            type="number"
                            value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                                else if (e.key === "Escape") handleCancel();
                            }}
                            className="h-8 flex-1 min-w-0"
                            placeholder="Max"
                            disabled={isSaving}
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                            {expectation.unit}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={handleSave}
                            disabled={isSaving}
                            aria-label="Save"
                        >
                            <Check className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={handleCancel}
                            disabled={isSaving}
                            aria-label="Cancel"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
            {error && (
                <p className="text-xs text-destructive mt-0.5">{error}</p>
            )}
        </div>
    );
}
