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

interface CreateOrgDialogProps {
    children: React.ReactNode;
}

export function CreateOrgDialog({ children }: CreateOrgDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Organization name is required");
            return;
        }

        if (!user?.id) {
            setError("You must be logged in to create an organization");
            return;
        }

        setIsSubmitting(true);

        try {
            const orgId = id();
            const now = new Date();

            db.transact([
                db.tx.organizations[orgId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    icon: icon.trim() || undefined,
                    created: now,
                    updated: now,
                }).link({ owner: user.id }),
            ]);

            // Reset form and close dialog
            setName("");
            setDescription("");
            setIcon("");
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create organization");
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
                        <DialogTitle>Create Organization</DialogTitle>
                        <DialogDescription>
                            Create a new organization to manage classes and students.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="org-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="org-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="My Organization"
                                    required
                                    disabled={isSubmitting}
                                />
                                <FieldDescription>
                                    The name of your organization
                                </FieldDescription>
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="org-description">Description</FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="org-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="A brief description of your organization"
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                                <FieldDescription>
                                    Optional description for your organization
                                </FieldDescription>
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="org-icon">Icon</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="org-icon"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    placeholder="🏢"
                                    maxLength={2}
                                    disabled={isSubmitting}
                                />
                                <FieldDescription>
                                    Optional emoji icon (1-2 characters)
                                </FieldDescription>
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
                            {isSubmitting ? "Creating..." : "Create Organization"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
