/** @format */

import { useState, useEffect } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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
import { FontAwesomeIconPickerLazy } from "@/components/icons/FontAwesomeIconPickerLazy";
import { FolderSelect } from "../../-components/folders/folder-select";
import { resolveIconId } from "@/lib/fontawesome-icon-catalog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface EditRewardItemDialogProps {
    children?: React.ReactNode;
    rewardItem: InstaQLEntity<
        AppSchema,
        "reward_items",
        { class?: {}; folder?: {} }
    >;
    classId: string;
    asDropdownItem?: boolean;
}

export function EditRewardItemDialog({
    children,
    rewardItem,
    classId,
    asDropdownItem = false,
}: EditRewardItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [costStr, setCostStr] = useState("");
    const [folderId, setFolderId] = useState<string | null>(null);
    const [iconDef, setIconDef] = useState<IconDefinition | null>(null);
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
            setFolderId(rewardItem.folder?.id ?? null);
            if (rewardItem.icon) {
                resolveIconId(rewardItem.icon).then(setIconDef);
            } else {
                setIconDef(null);
            }
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
            const transactions = [
                db.tx.reward_items[rewardItem.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    icon: iconDef ? `${iconDef.prefix}:${iconDef.iconName}` : undefined,
                    cost,
                    updated: now,
                }),
            ];
            if (
                rewardItem.folder &&
                (!folderId || folderId !== rewardItem.folder!.id)
            ) {
                transactions.push(
                    db.tx.reward_items[rewardItem.id].unlink({
                        folder: rewardItem.folder!.id,
                    })
                );
            }
            if (folderId) {
                transactions.push(
                    db.tx.reward_items[rewardItem.id].link({
                        folder: folderId,
                    })
                );
            }
            db.transact(transactions);
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
            setFolderId(null);
            setIconDef(null);
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
                    <FieldLabel>Icon</FieldLabel>
                    <FieldContent>
                        <div className="flex items-center gap-2">
                            <FontAwesomeIconPickerLazy
                                value={iconDef}
                                onChange={(def) => setIconDef(def)}
                                placeholder="Pick an icon (optional)"
                                disabled={isSubmitting}
                            />
                            {iconDef && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIconDef(null)}
                                    disabled={isSubmitting}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </FieldContent>
                </Field>

                <FolderSelect
                    classId={classId}
                    value={folderId}
                    onChange={setFolderId}
                    disabled={isSubmitting}
                    placeholder="Uncategorized"
                />

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
                    className="flex items-center gap-2"
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
