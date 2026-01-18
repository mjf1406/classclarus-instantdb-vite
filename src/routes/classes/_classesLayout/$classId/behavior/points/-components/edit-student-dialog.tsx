/** @format */

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

const GENDER_OPTIONS = [
    { value: "", label: "—" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface EditStudentDialogProps {
    children?: React.ReactNode;
    student: InstaQLEntity<AppSchema, "$users">;
    classId: string;
    existingRoster: { id: string; number?: number } | null;
    asDropdownItem?: boolean;
}

export function EditStudentDialog({
    children,
    student,
    classId,
    existingRoster,
    asDropdownItem = false,
}: EditStudentDialogProps) {
    const [open, setOpen] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [numberStr, setNumberStr] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && student) {
            setFirstName(student.firstName || "");
            setLastName(student.lastName || "");
            setGender(student.gender || "");
            setNumberStr(
                existingRoster?.number !== undefined && existingRoster?.number !== null
                    ? String(existingRoster.number)
                    : ""
            );
        }
    }, [open, student, existingRoster]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!firstName.trim()) {
            setError("First name is required");
            return;
        }

        const rosterNumber =
            numberStr.trim() === "" ? undefined : Number(numberStr);
        if (
            numberStr.trim() !== "" &&
            (rosterNumber === undefined || Number.isNaN(rosterNumber))
        ) {
            setError("Roster number must be a number");
            return;
        }

        setIsSubmitting(true);

        try {
            const transactions: Parameters<typeof db.transact>[0][] = [
                db.tx.$users[student.id].update({
                    firstName: firstName.trim(),
                    lastName: lastName.trim() || undefined,
                    gender: gender || undefined,
                }),
            ];

            if (existingRoster) {
                transactions.push(
                    db.tx.class_roster[existingRoster.id].update({
                        number: rosterNumber,
                    })
                );
            } else if (rosterNumber !== undefined) {
                const rosterId = id();
                transactions.push(
                    db.tx.class_roster[rosterId]
                        .create({ number: rosterNumber })
                        .link({ class: classId })
                        .link({ student: student.id })
                );
            }

            db.transact(transactions as Parameters<typeof db.transact>[0]);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update student"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setError(null);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
                <DialogDescription>
                    Update student details and roster number for this class.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Field>
                    <FieldLabel htmlFor="edit-student-firstName">
                        First name *
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-student-firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="e.g. Alex"
                            required
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-student-lastName">
                        Last name
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-student-lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Optional"
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-student-gender">Gender</FieldLabel>
                    <FieldContent>
                        <Select
                            value={gender || ""}
                            onValueChange={setGender}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="edit-student-gender">
                                <SelectValue placeholder="Select (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {GENDER_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value || "empty"}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-student-number">
                        Roster number
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-student-number"
                            type="number"
                            value={numberStr}
                            onChange={(e) => setNumberStr(e.target.value)}
                            placeholder="e.g. 3 (optional)"
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                {error && <FieldError>{error}</FieldError>}
            </div>
            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </DialogFooter>
        </form>
    );

    if (asDropdownItem) {
        return (
            <>
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                    className="flex items-center gap-2"
                >
                    {children || "Edit student"}
                </DropdownMenuItem>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogContent>{formContent}</DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                {children}
            </DialogTrigger>
            <DialogContent>{formContent}</DialogContent>
        </Dialog>
    );
}
