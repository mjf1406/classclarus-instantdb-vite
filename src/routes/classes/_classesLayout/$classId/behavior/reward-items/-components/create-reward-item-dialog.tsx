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

interface CreateRewardItemDialogProps {
    children: React.ReactNode;
    classId: string;
}

export function CreateRewardItemDialog({
    children,
    classId,
}: CreateRewardItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [costStr, setCostStr] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        const cost = costStr.trim() === "" ? undefined : Number(costStr);
        if (cost === undefined || Number.isNaN(cost) || cost <= 0) {
            setError("Cost must be a positive number");
            return;
        }

        setIsSubmitting(true);

        try {
            const rewardItemId = id();
            const now = new Date();

            db.transact([
                db.tx.reward_items[rewardItemId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    cost,
                    created: now,
                    updated: now,
                }),
                db.tx.reward_items[rewardItemId].link({ class: classId }),
            ]);

            setName("");
            setDescription("");
            setCostStr("");
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create reward item"
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
            setCostStr("");
            setError(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Reward Item</DialogTitle>
                        <DialogDescription>
                            Add a reward that students can redeem with points.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="reward-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="reward-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Extra recess"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="reward-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="reward-description"
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
                            <FieldLabel htmlFor="reward-cost">
                                Cost (points) *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="reward-cost"
                                    type="number"
                                    min={1}
                                    value={costStr}
                                    onChange={(e) => setCostStr(e.target.value)}
                                    placeholder="e.g. 10"
                                    disabled={isSubmitting}
                                    required
                                />
                            </FieldContent>
                            <p className="text-xs text-muted-foreground mt-1">
                                Points required to redeem this reward.
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
                            {isSubmitting ? "Creating..." : "Create Reward Item"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
