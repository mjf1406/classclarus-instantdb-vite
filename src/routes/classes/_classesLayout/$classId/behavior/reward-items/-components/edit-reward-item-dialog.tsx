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

interface EditRewardItemDialogProps {
    children?: React.ReactNode;
    rewardItem: InstaQLEntity<
        AppSchema,
        "reward_items",
        { class?: {} }
    >;
    classId: string;
    asDropdownItem?: boolean;
}

export function EditRewardItemDialog({
    children,
    rewardItem,
    asDropdownItem = false,
}: EditRewardItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [costStr, setCostStr] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && rewardItem) {
            setName(rewardItem.name || "");
            setDescription(rewardItem.description || "");
            setCostStr(
                rewardItem.cost !== undefined && rewardItem.cost !== null
                    ? String(rewardItem.cost)
                    : ""
            );
        }
    }, [open, rewardItem]);

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
            const now = new Date();
            db.transact([
                db.tx.reward_items[rewardItem.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    cost,
                    updated: now,
                }),
            ]);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update reward item"
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

    const formContent = (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Edit Reward Item</DialogTitle>
                <DialogDescription>
                    Update reward item details and cost.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Field>
                    <FieldLabel htmlFor="edit-reward-name">Name *</FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-reward-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Extra recess"
                            required
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-reward-description">
                        Description
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id="edit-reward-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-reward-cost">Cost (points) *</FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-reward-cost"
                            type="number"
                            min={1}
                            value={costStr}
                            onChange={(e) => setCostStr(e.target.value)}
                            placeholder="e.g. 10"
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
