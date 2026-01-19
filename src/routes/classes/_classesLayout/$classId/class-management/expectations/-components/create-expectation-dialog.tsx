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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateExpectationDialogProps {
    children: React.ReactNode;
    classId: string;
}

export function CreateExpectationDialog({
    children,
    classId,
}: CreateExpectationDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [inputType, setInputType] = useState<"number" | "numberRange">("number");
    const [unit, setUnit] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        if (!unit.trim()) {
            setError("Unit is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const expectationId = id();
            const now = new Date();

            db.transact([
                db.tx.expectations[expectationId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    inputType,
                    unit: unit.trim(),
                    created: now,
                    updated: now,
                }),
                db.tx.expectations[expectationId].link({ class: classId }),
            ]);

            setName("");
            setDescription("");
            setInputType("number");
            setUnit("");
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create expectation"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setName("");
            setDescription("");
            setInputType("number");
            setUnit("");
            setError(null);
        }
    };

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <CredenzaHeader>
                        <CredenzaTitle>Create Expectation</CredenzaTitle>
                        <CredenzaDescription>
                            Add an expectation that students can work towards.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody className="flex-1 overflow-hidden min-h-0">
                        <ScrollArea className="h-full">
                            <div className="space-y-4 pr-4 pb-4">
                                <Field>
                                    <FieldLabel htmlFor="expectation-name">Name *</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="expectation-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Reading minutes per day"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="expectation-description">
                                        Description
                                    </FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            id="expectation-description"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            placeholder="Optional description"
                                            rows={3}
                                            disabled={isSubmitting}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="expectation-input-type">
                                        Input Type *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Select
                                            value={inputType}
                                            onValueChange={(value) =>
                                                setInputType(value as "number" | "numberRange")
                                            }
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger id="expectation-input-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="numberRange">Number Range</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {inputType === "number"
                                            ? "Students will enter a single number value."
                                            : "Students will enter a minimum and maximum value range."}
                                    </p>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="expectation-unit">Unit *</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="expectation-unit"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            placeholder="e.g. minutes, pages, words"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </FieldContent>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        The unit of measurement for this expectation.
                                    </p>
                                </Field>

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
                            {isSubmitting ? "Creating..." : "Create Expectation"}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
