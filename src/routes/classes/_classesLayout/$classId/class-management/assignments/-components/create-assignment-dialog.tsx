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
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssignmentForm, type SectionForm } from "./assignment-form";

interface CreateAssignmentDialogProps {
    children: React.ReactNode;
    classId: string;
}

export function CreateAssignmentDialog({
    children,
    classId,
}: CreateAssignmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [unit, setUnit] = useState("");
    const [sections, setSections] = useState<SectionForm[]>([]);
    const [totalPoints, setTotalPoints] = useState<number | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasSections = sections.length > 0;
    const computedTotal = sections.reduce((sum, s) => sum + (s.points || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Assignment name is required");
            return;
        }

        if (!hasSections && !totalPoints) {
            setError("Either sections or total points must be provided");
            return;
        }

        setIsSubmitting(true);

        try {
            const assignmentId = id();
            const now = new Date();

            const sectionsJson = hasSections ? JSON.stringify(sections) : undefined;
            const finalTotalPoints = hasSections ? computedTotal : totalPoints;

            const transactions = [
                db.tx.assignments[assignmentId].create({
                    name: name.trim(),
                    subject: subject.trim() || undefined,
                    unit: unit.trim() || undefined,
                    totalPoints: finalTotalPoints ?? undefined,
                    sections: sectionsJson,
                    created: now,
                    updated: now,
                }),
                db.tx.assignments[assignmentId].link({ class: classId }),
            ];

            db.transact(transactions);

            // Reset form and close dialog
            setName("");
            setSubject("");
            setUnit("");
            setSections([]);
            setTotalPoints(undefined);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create assignment"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setName("");
            setSubject("");
            setUnit("");
            setSections([]);
            setTotalPoints(undefined);
            setError(null);
        }
    };

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col h-full min-h-0 overflow-hidden"
                >
                    <CredenzaHeader className="shrink-0">
                        <CredenzaTitle>Create Assignment</CredenzaTitle>
                        <CredenzaDescription>
                            Create a new assignment with optional subject and unit.
                            Define points using sections or a total.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="space-y-4 pr-4 pb-4">
                                <AssignmentForm
                                    name={name}
                                    subject={subject}
                                    unit={unit}
                                    sections={sections}
                                    totalPoints={totalPoints}
                                    onNameChange={setName}
                                    onSubjectChange={setSubject}
                                    onUnitChange={setUnit}
                                    onSectionsChange={setSections}
                                    onTotalPointsChange={setTotalPoints}
                                    disabled={isSubmitting}
                                    error={error}
                                />
                            </div>
                        </ScrollArea>
                    </CredenzaBody>
                    <CredenzaFooter className="shrink-0">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Assignment"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
