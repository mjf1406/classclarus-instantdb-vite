/** @format */

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssignmentForm, type SectionForm } from "./assignment-form";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type AssignmentEntity = InstaQLEntity<AppSchema, "assignments">;

interface EditAssignmentDialogProps {
    children?: React.ReactNode;
    assignment: AssignmentEntity;
    classId: string;
    asDropdownItem?: boolean;
}

export function EditAssignmentDialog({
    children,
    assignment,
    classId,
    asDropdownItem = false,
}: EditAssignmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [unit, setUnit] = useState("");
    const [sections, setSections] = useState<SectionForm[]>([]);
    const [totalPoints, setTotalPoints] = useState<number | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && assignment) {
            setName(assignment.name || "");
            setSubject(assignment.subject || "");
            setUnit(assignment.unit || "");
            
            // Parse sections from JSON string if it exists
            if (assignment.sections) {
                try {
                    const parsedSections = JSON.parse(assignment.sections) as SectionForm[];
                    setSections(parsedSections);
                    setTotalPoints(undefined);
                } catch {
                    setSections([]);
                    setTotalPoints(assignment.totalPoints);
                }
            } else {
                setSections([]);
                setTotalPoints(assignment.totalPoints);
            }
        }
    }, [open, assignment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Assignment name is required");
            return;
        }

        const hasSections = sections.length > 0;
        if (!hasSections && !totalPoints) {
            setError("Either sections or total points must be provided");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            const computedTotal = sections.reduce((sum, s) => sum + (s.points || 0), 0);
            const sectionsJson = hasSections ? JSON.stringify(sections) : undefined;
            const finalTotalPoints = hasSections ? computedTotal : totalPoints;

            db.transact([
                db.tx.assignments[assignment.id].update({
                    name: name.trim(),
                    subject: subject.trim() || undefined,
                    unit: unit.trim() || undefined,
                    totalPoints: finalTotalPoints ?? undefined,
                    sections: sectionsJson,
                    updated: now,
                }),
            ]);

            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update assignment"
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

    const formContent = (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col h-full min-h-0 overflow-hidden"
        >
            <CredenzaHeader className="shrink-0">
                <CredenzaTitle>Edit Assignment</CredenzaTitle>
                <CredenzaDescription>
                    Update the assignment details, subject, unit, and points.
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
                    {isSubmitting ? "Saving..." : "Save Changes"}
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
                    <Pencil className="size-4" />
                    {children || "Edit"}
                </DropdownMenuItem>
                <Credenza open={open} onOpenChange={handleOpenChange}>
                    <CredenzaContent className="flex flex-col max-h-[90vh]">
                        {formContent}
                    </CredenzaContent>
                </Credenza>
            </>
        );
    }

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>
                <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {children}
                </div>
            </CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                {formContent}
            </CredenzaContent>
        </Credenza>
    );
}
