/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import {
    Credenza,
    CredenzaTrigger,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { validateStudentExpectationValue } from "@/lib/expectation-validation";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Expectation = InstaQLEntity<AppSchema, "expectations">;
type Student = InstaQLEntity<AppSchema, "$users">;
type StudentExpectation = InstaQLEntity<
    AppSchema,
    "student_expectations",
    { expectation?: {}; student?: {}; class?: {} }
>;

interface BulkSetExpectationDialogProps {
    expectation: Expectation;
    students: Student[];
    studentExpectations: StudentExpectation[];
    classId: string;
    children: React.ReactNode;
}

export function BulkSetExpectationDialog({
    expectation,
    students,
    studentExpectations,
    classId,
    children,
}: BulkSetExpectationDialogProps) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"set" | "increase" | "decrease" | "increasePercent" | "decreasePercent">("set");
    const [value, setValue] = useState<string>("");
    const [minValue, setMinValue] = useState<string>("");
    const [maxValue, setMaxValue] = useState<string>("");
    const [adjustmentValue, setAdjustmentValue] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create map for quick student expectation lookup
    const studentExpectationMap = new Map<string, StudentExpectation>();
    for (const se of studentExpectations) {
        const studentId = se.student?.id;
        if (studentId && se.expectation?.id === expectation.id) {
            studentExpectationMap.set(studentId, se);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        let parsedValue: number | undefined;
        let parsedMinValue: number | undefined;
        let parsedMaxValue: number | undefined;
        let parsedAdjustment: number | undefined;

        // Validate adjustment value for increase/decrease modes
        if (mode !== "set") {
            const trimmed = adjustmentValue.trim();
            parsedAdjustment = trimmed === "" ? undefined : Number(trimmed);
            if (parsedAdjustment === undefined || Number.isNaN(parsedAdjustment)) {
                setError("Adjustment value must be a valid number");
                return;
            }
            if (parsedAdjustment < 0 && (mode === "increase" || mode === "increasePercent")) {
                setError("Adjustment value must be positive for increase");
                return;
            }
            if (parsedAdjustment < 0 && (mode === "decrease" || mode === "decreasePercent")) {
                setError("Adjustment value must be positive for decrease");
                return;
            }
        }

        if (mode === "set") {
            // Set mode - validate the set values
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

            // Validate using utility for set mode
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
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            const transactions: any[] = [];

            for (const student of students) {
                const existingSe = studentExpectationMap.get(student.id);

                let finalValue: number | undefined;
                let finalMinValue: number | undefined;
                let finalMaxValue: number | undefined;

                if (mode === "set") {
                    // Set mode - use the entered values directly
                    finalValue = parsedValue;
                    finalMinValue = parsedMinValue;
                    finalMaxValue = parsedMaxValue;
                } else {
                    // Increase/decrease modes - calculate from existing values
                    if (expectation.inputType === "number") {
                        const currentValue = existingSe?.value ?? 0;
                        if (mode === "increase") {
                            finalValue = currentValue + parsedAdjustment!;
                        } else if (mode === "decrease") {
                            finalValue = Math.max(0, currentValue - parsedAdjustment!);
                        } else if (mode === "increasePercent") {
                            finalValue = currentValue * (1 + parsedAdjustment! / 100);
                        } else if (mode === "decreasePercent") {
                            finalValue = Math.max(0, currentValue * (1 - parsedAdjustment! / 100));
                        }
                    } else {
                        // numberRange mode
                        const currentMin = existingSe?.minValue ?? 0;
                        const currentMax = existingSe?.maxValue ?? 0;
                        if (mode === "increase") {
                            finalMinValue = currentMin + parsedAdjustment!;
                            finalMaxValue = currentMax + parsedAdjustment!;
                        } else if (mode === "decrease") {
                            finalMinValue = Math.max(0, currentMin - parsedAdjustment!);
                            finalMaxValue = Math.max(0, currentMax - parsedAdjustment!);
                        } else if (mode === "increasePercent") {
                            finalMinValue = currentMin * (1 + parsedAdjustment! / 100);
                            finalMaxValue = currentMax * (1 + parsedAdjustment! / 100);
                        } else if (mode === "decreasePercent") {
                            finalMinValue = Math.max(0, currentMin * (1 - parsedAdjustment! / 100));
                            finalMaxValue = Math.max(0, currentMax * (1 - parsedAdjustment! / 100));
                        }
                    }
                }

                // Validate the final values
                const validationError = validateStudentExpectationValue(
                    expectation,
                    finalValue,
                    finalMinValue,
                    finalMaxValue
                );
                if (validationError) {
                    setError(`Invalid value for student: ${validationError}`);
                    return;
                }

                if (existingSe) {
                    // Update existing
                    const updateData: Record<string, unknown> = {
                        updated: now,
                    };
                    if (expectation.inputType === "number") {
                        updateData.value = finalValue;
                        updateData.minValue = undefined;
                        updateData.maxValue = undefined;
                    } else {
                        updateData.minValue = finalMinValue;
                        updateData.maxValue = finalMaxValue;
                        updateData.value = undefined;
                    }
                    transactions.push(
                        db.tx.student_expectations[existingSe.id].update(
                            updateData
                        )
                    );
                } else {
                    // Create new
                    const studentExpectationId = id();
                    const createData = {
                        created: now,
                        updated: now,
                        ...(expectation.inputType === "number"
                            ? { value: finalValue }
                            : {
                                  minValue: finalMinValue,
                                  maxValue: finalMaxValue,
                              }),
                    };
                    transactions.push(
                        db.tx.student_expectations[studentExpectationId].create(
                            createData
                        ),
                        db.tx.student_expectations[studentExpectationId].link({
                            expectation: expectation.id,
                        }),
                        db.tx.student_expectations[studentExpectationId].link({
                            student: student.id,
                        }),
                        db.tx.student_expectations[studentExpectationId].link({
                            class: classId,
                        })
                    );
                }
            }

            if (transactions.length > 0) {
                db.transact(transactions);
            }

            setValue("");
            setMinValue("");
            setMaxValue("");
            setAdjustmentValue("");
            setMode("set");
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to set expectation values"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setValue("");
            setMinValue("");
            setMaxValue("");
            setAdjustmentValue("");
            setMode("set");
            setError(null);
        }
    };

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <CredenzaHeader>
                        <CredenzaTitle>
                            {mode === "set"
                                ? `Set ${expectation.name} for All Students`
                                : mode === "increase"
                                ? `Increase ${expectation.name} for All Students`
                                : mode === "decrease"
                                ? `Decrease ${expectation.name} for All Students`
                                : mode === "increasePercent"
                                ? `Increase ${expectation.name} by Percentage`
                                : `Decrease ${expectation.name} by Percentage`}
                        </CredenzaTitle>
                        <CredenzaDescription>
                            {mode === "set"
                                ? `Set the same value for all ${students.length} students in this class.`
                                : mode === "increase" || mode === "decrease"
                                ? `${mode === "increase" ? "Increase" : "Decrease"} all ${students.length} students' values by a specific amount.`
                                : `${mode === "increasePercent" ? "Increase" : "Decrease"} all ${students.length} students' values by a percentage.`}
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody className="flex-1 overflow-hidden min-h-0">
                        <ScrollArea className="h-full">
                            <div className="space-y-4 pr-4 pb-4">
                                <Field>
                                    <FieldLabel htmlFor="bulk-mode">
                                        Operation *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Select
                                            value={mode}
                                            onValueChange={(value) =>
                                                setMode(value as typeof mode)
                                            }
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger id="bulk-mode">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="set">Set to specific value</SelectItem>
                                                <SelectItem value="increase">Increase by number</SelectItem>
                                                <SelectItem value="decrease">Decrease by number</SelectItem>
                                                <SelectItem value="increasePercent">Increase by percentage</SelectItem>
                                                <SelectItem value="decreasePercent">Decrease by percentage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                </Field>

                                {mode === "set" ? (
                                    expectation.inputType === "number" ? (
                                        <Field>
                                            <FieldLabel htmlFor="bulk-value">
                                                Value * ({expectation.unit})
                                            </FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    id="bulk-value"
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) =>
                                                        setValue(e.target.value)
                                                    }
                                                    placeholder="Enter value"
                                                    required
                                                    disabled={isSubmitting}
                                                    autoFocus
                                                />
                                            </FieldContent>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                This value will be set for all students.
                                            </p>
                                        </Field>
                                    ) : (
                                        <>
                                            <Field>
                                                <FieldLabel htmlFor="bulk-min-value">
                                                    Minimum Value * ({expectation.unit})
                                                </FieldLabel>
                                                <FieldContent>
                                                    <Input
                                                        id="bulk-min-value"
                                                        type="number"
                                                        value={minValue}
                                                        onChange={(e) =>
                                                            setMinValue(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter minimum"
                                                        required
                                                        disabled={isSubmitting}
                                                        autoFocus
                                                    />
                                                </FieldContent>
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor="bulk-max-value">
                                                    Maximum Value * ({expectation.unit})
                                                </FieldLabel>
                                                <FieldContent>
                                                    <Input
                                                        id="bulk-max-value"
                                                        type="number"
                                                        value={maxValue}
                                                        onChange={(e) =>
                                                            setMaxValue(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter maximum"
                                                        required
                                                        disabled={isSubmitting}
                                                    />
                                                </FieldContent>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    This range will be set for all students.
                                                </p>
                                            </Field>
                                        </>
                                    )
                                ) : (
                                    <Field>
                                        <FieldLabel htmlFor="bulk-adjustment">
                                            {mode === "increase" || mode === "decrease"
                                                ? `Amount to ${mode === "increase" ? "increase" : "decrease"} * (${expectation.unit})`
                                                : `Percentage to ${mode === "increasePercent" ? "increase" : "decrease"} *`}
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id="bulk-adjustment"
                                                type="number"
                                                value={adjustmentValue}
                                                onChange={(e) =>
                                                    setAdjustmentValue(e.target.value)
                                                }
                                                placeholder={
                                                    mode === "increase" || mode === "decrease"
                                                        ? "Enter amount"
                                                        : "Enter percentage (e.g., 10 for 10%)"
                                                }
                                                required
                                                disabled={isSubmitting}
                                                autoFocus
                                                min={0}
                                                step={mode === "increasePercent" || mode === "decreasePercent" ? 0.1 : 1}
                                            />
                                        </FieldContent>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {mode === "increase" || mode === "decrease"
                                                ? `All students' values will be ${mode === "increase" ? "increased" : "decreased"} by this amount.`
                                                : `All students' values will be ${mode === "increasePercent" ? "increased" : "decreased"} by this percentage.`}
                                            {expectation.inputType === "numberRange" &&
                                                " Both min and max values will be adjusted."}
                                        </p>
                                    </Field>
                                )}

                                {error && <FieldError>{error}</FieldError>}
                            </div>
                        </ScrollArea>
                    </CredenzaBody>
                    <CredenzaFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? "Applying changes..."
                                : mode === "set"
                                ? `Set for All ${students.length} Students`
                                : mode === "increase"
                                ? `Increase All ${students.length} Students`
                                : mode === "decrease"
                                ? `Decrease All ${students.length} Students`
                                : mode === "increasePercent"
                                ? `Increase All ${students.length} Students by %`
                                : `Decrease All ${students.length} Students by %`}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
