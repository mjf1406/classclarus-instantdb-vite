/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
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
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrgIconSelector } from "@/components/ui/org-icon-selector";

interface CreateClassDialogProps {
    children: React.ReactNode;
    orgId: string;
}

export function CreateClassDialog({ children, orgId }: CreateClassDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Class name is required");
            return;
        }

        if (!user?.id) {
            setError("You must be logged in to create a class");
            return;
        }

        setIsSubmitting(true);

        try {
            const classId = id();
            const now = new Date();

            db.transact([
                db.tx.classes[classId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    icon: icon || undefined,
                    created: now,
                    updated: now,
                    archivedAt: null,
                })
                    .link({ owner: user.id })
                    .link({ organization: orgId }),
            ]);

            // Reset form and close dialog
            setName("");
            setDescription("");
            setIcon(undefined);
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create class");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Class</DialogTitle>
                        <DialogDescription>
                            Create a new class to manage students and assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="class-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="class-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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
                            <FieldLabel htmlFor="class-description">Description</FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="class-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
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
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Class"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
