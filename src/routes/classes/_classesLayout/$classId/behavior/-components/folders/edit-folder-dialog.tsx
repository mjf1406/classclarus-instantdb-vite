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
import { resolveIconId } from "@/lib/fontawesome-icon-catalog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface EditFolderDialogProps {
    children?: React.ReactNode;
    folder: InstaQLEntity<AppSchema, "folders", { class?: {} }>;
    asDropdownItem?: boolean;
}

export function EditFolderDialog({
    children,
    folder,
    asDropdownItem = false,
}: EditFolderDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [iconDef, setIconDef] = useState<IconDefinition | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && folder) {
            setName(folder.name || "");
            setDescription(folder.description || "");
            if (folder.icon) {
                resolveIconId(folder.icon).then(setIconDef);
            } else {
                setIconDef(null);
            }
        }
    }, [open, folder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            db.transact([
                db.tx.folders[folder.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    updated: now,
                }),
            ]);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update folder"
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

    const formContent = (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Edit Folder</DialogTitle>
                <DialogDescription>
                    Update folder name and description.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Field>
                    <FieldLabel htmlFor="edit-folder-name">Name *</FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-folder-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Participation"
                            required
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-folder-description">
                        Description
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id="edit-folder-description"
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
