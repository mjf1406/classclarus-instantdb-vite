/** @format */

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

interface CreateBehaviorDialogProps {
    children: React.ReactNode;
    classId: string;
}

export function CreateBehaviorDialog({
    children,
    classId,
}: CreateBehaviorDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [pointsStr, setPointsStr] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const behaviorId = id();
            const now = new Date();

            db.transact([
                db.tx.behaviors[behaviorId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    points,
                    created: now,
                    updated: now,
                }),
                db.tx.behaviors[behaviorId].link({ class: classId }),
            ]);

            setName("");
            setDescription("");
            setPointsStr("");
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create behavior"
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Behavior</DialogTitle>
                        <DialogDescription>
                            Add a behavior that adds or subtracts points.
                            Use positive numbers to add points, negative to subtract.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="behavior-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="behavior-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Helping a classmate"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="behavior-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="behavior-description"
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
                            <FieldLabel htmlFor="behavior-points">
                                Points *
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="behavior-points"
                                    type="number"
                                    value={pointsStr}
                                    onChange={(e) => setPointsStr(e.target.value)}
                                    placeholder="e.g. 5 or -2"
                                    disabled={isSubmitting}
                                    required
                                />
                            </FieldContent>
                            <p className="text-xs text-muted-foreground mt-1">
                                Positive to add points, negative to subtract.
                            </p>
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
                            {isSubmitting ? "Creating..." : "Create Behavior"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
