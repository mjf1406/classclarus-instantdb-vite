/** @format */

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface EditBehaviorDialogProps {
    children?: React.ReactNode;
    behavior: InstaQLEntity<AppSchema, "behaviors", { class?: {} }>;
    classId: string;
    asDropdownItem?: boolean;
}

export function EditBehaviorDialog({
    children,
    behavior,
    asDropdownItem = false,
}: EditBehaviorDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [pointsStr, setPointsStr] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && behavior) {
            setName(behavior.name || "");
            setDescription(behavior.description || "");
            setPointsStr(
                behavior.points !== undefined && behavior.points !== null
                    ? String(behavior.points)
                    : ""
            );
        }
    }, [open, behavior]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        const points = pointsStr.trim() === "" ? undefined : Number(pointsStr);
        if (points === undefined || Number.isNaN(points)) {
            setError("Points must be a number (positive or negative)");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            db.transact([
                db.tx.behaviors[behavior.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    points,
                    updated: now,
                }),
            ]);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update behavior"
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
            setPointsStr("");
            setError(null);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Edit Behavior</DialogTitle>
                <DialogDescription>
                    Update behavior details. Use positive points to add, negative to subtract.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Field>
                    <FieldLabel htmlFor="edit-behavior-name">Name *</FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-behavior-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Helping a classmate"
                            required
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-behavior-description">
                        Description
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id="edit-behavior-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-behavior-points">Points *</FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-behavior-points"
                            type="number"
                            value={pointsStr}
                            onChange={(e) => setPointsStr(e.target.value)}
                            placeholder="e.g. 5 or -2"
                            disabled={isSubmitting}
                            required
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
                >
                    {children || "Edit"}
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
