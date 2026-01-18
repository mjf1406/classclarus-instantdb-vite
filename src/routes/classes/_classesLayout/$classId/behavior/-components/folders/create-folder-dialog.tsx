/** @format */

import { useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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
import { FontAwesomeIconPickerLazy } from "@/components/icons/FontAwesomeIconPickerLazy";

interface CreateFolderDialogProps {
    children: React.ReactNode;
    classId: string;
}

export function CreateFolderDialog({
    children,
    classId,
}: CreateFolderDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [iconDef, setIconDef] = useState<IconDefinition | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const folderId = id();
            const now = new Date();

            db.transact([
                db.tx.folders[folderId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    icon: iconDef ? `${iconDef.prefix}:${iconDef.iconName}` : undefined,
                    created: now,
                    updated: now,
                }),
                db.tx.folders[folderId].link({ class: classId }),
            ]);

            setName("");
            setDescription("");
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create folder"
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
            setIconDef(null);
            setError(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Folder</DialogTitle>
                        <DialogDescription>
                            Create a folder to organize behaviors and reward items.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="folder-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="folder-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Participation"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="folder-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="folder-description"
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
                            {isSubmitting ? "Creating..." : "Create Folder"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
