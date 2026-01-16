/** @format */

import { useState } from "react";
import type { ClassByRole } from "@/hooks/use-class-hooks";
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
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EditIcon } from "lucide-react";
import { OrgIconSelector } from "@/components/ui/org-icon-selector";

interface EditClassDialogProps {
    classEntity: ClassByRole;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
}

export function EditClassDialog({
    classEntity,
    children,
    asDropdownItem = false,
}: EditClassDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(classEntity.name);
    const [description, setDescription] = useState(
        classEntity.description || ""
    );
    const [icon, setIcon] = useState(classEntity.icon);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setName(classEntity.name);
            setDescription(classEntity.description || "");
            setIcon(classEntity.icon);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Class name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();

            db.transact([
                db.tx.classes[classEntity.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    icon: icon || undefined,
                    updated: now,
                }),
            ]);

            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update class"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const trigger = children || (
        <Button
            variant="ghost"
            size="icon-sm"
        >
            <EditIcon />
            <span className="sr-only">Edit class</span>
        </Button>
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
                    <EditIcon />
                    Edit
                </DropdownMenuItem>
                <Dialog
                    open={open}
                    onOpenChange={handleOpenChange}
                >
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Edit Class</DialogTitle>
                                <DialogDescription>
                                    Update your class details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Field>
                                    <FieldLabel htmlFor="edit-class-name">
                                        Name *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-class-name"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            placeholder="My Class"
                                            required
                                            disabled={isSubmitting}
                                        />
                                        <FieldDescription>
                                            The name of your class
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="edit-class-description">
                                        Description
                                    </FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            id="edit-class-description"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            placeholder="A brief description of your class"
                                            rows={3}
                                            disabled={isSubmitting}
                                        />
                                        <FieldDescription>
                                            Optional description for your class
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Icon</FieldLabel>
                                    <FieldContent>
                                        <OrgIconSelector
                                            value={icon}
                                            onChange={setIcon}
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
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Saving..."
                                        : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={handleOpenChange}
            >
                <DialogTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                >
                    {trigger}
                </DialogTrigger>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Class</DialogTitle>
                            <DialogDescription>
                                Update your class details.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Field>
                                <FieldLabel htmlFor="edit-class-name">
                                    Name *
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-class-name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="My Class"
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <FieldDescription>
                                        The name of your class
                                    </FieldDescription>
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="edit-class-description">
                                    Description
                                </FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="edit-class-description"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="A brief description of your class"
                                        rows={3}
                                        disabled={isSubmitting}
                                    />
                                    <FieldDescription>
                                        Optional description for your class
                                    </FieldDescription>
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>Icon</FieldLabel>
                                <FieldContent>
                                    <OrgIconSelector
                                        value={icon}
                                        onChange={setIcon}
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
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
