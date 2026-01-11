/** @format */

import { useState } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
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

type Organization = InstaQLEntity<AppSchema, "organizations">;

interface EditOrgDialogProps {
    organization: Organization;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
}

export function EditOrgDialog({
    organization,
    children,
    asDropdownItem = false,
}: EditOrgDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(organization.name);
    const [description, setDescription] = useState(
        organization.description || ""
    );
    const [icon, setIcon] = useState(organization.icon || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setName(organization.name);
            setDescription(organization.description || "");
            setIcon(organization.icon || "");
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Organization name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();

            db.transact([
                db.tx.organizations[organization.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    icon: icon.trim() || undefined,
                    updated: now,
                }),
            ]);

            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update organization"
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
            <span className="sr-only">Edit organization</span>
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
                                <DialogTitle>Edit Organization</DialogTitle>
                                <DialogDescription>
                                    Update your organization details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Field>
                                    <FieldLabel htmlFor="edit-org-name">
                                        Name *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-org-name"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
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
                                    <FieldLabel htmlFor="edit-org-description">
                                        Description
                                    </FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            id="edit-org-description"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            placeholder="A brief description of your organization"
                                            rows={3}
                                            disabled={isSubmitting}
                                        />
                                        <FieldDescription>
                                            Optional description for your
                                            organization
                                        </FieldDescription>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="edit-org-icon">
                                        Icon
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-org-icon"
                                            value={icon}
                                            onChange={(e) =>
                                                setIcon(e.target.value)
                                            }
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
                            <DialogTitle>Edit Organization</DialogTitle>
                            <DialogDescription>
                                Update your organization details.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Field>
                                <FieldLabel htmlFor="edit-org-name">
                                    Name *
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-org-name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
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
                                <FieldLabel htmlFor="edit-org-description">
                                    Description
                                </FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="edit-org-description"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="A brief description of your organization"
                                        rows={3}
                                        disabled={isSubmitting}
                                    />
                                    <FieldDescription>
                                        Optional description for your
                                        organization
                                    </FieldDescription>
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="edit-org-icon">
                                    Icon
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-org-icon"
                                        value={icon}
                                        onChange={(e) =>
                                            setIcon(e.target.value)
                                        }
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
