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
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OrgIconSelector } from "@/components/ui/org-icon-selector";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

interface CreateClassWithOrgSelectorProps {
    children: React.ReactNode;
}

export function CreateClassWithOrgSelector({
    children,
}: CreateClassWithOrgSelectorProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState<string | undefined>(undefined);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, organizations } = useAuthContext();

    // Auto-select org if there's only one
    useEffect(() => {
        if (organizations.length === 1 && !selectedOrgId) {
            setSelectedOrgId(organizations[0].id);
        }
    }, [organizations, selectedOrgId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Class name is required");
            return;
        }

        if (!selectedOrgId) {
            setError("Please select an organization");
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
                db.tx.classes[classId]
                    .create({
                        name: name.trim(),
                        description: description.trim() || undefined,
                        icon: icon || undefined,
                        created: now,
                        updated: now,
                        archivedAt: null,
                    })
                    .link({ owner: user.id })
                    .link({ organization: selectedOrgId }),
            ]);

            // Reset form and close dialog
            setName("");
            setDescription("");
            setIcon(undefined);
            setSelectedOrgId("");
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create class"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            // When opening, auto-select org if there's only one
            if (organizations.length === 1) {
                setSelectedOrgId(organizations[0].id);
            }
        } else {
            // Reset form when closing
            setName("");
            setDescription("");
            setIcon(undefined);
            setSelectedOrgId("");
            setError(null);
        }
    };

    if (organizations.length === 0) {
        return (
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>No Organizations</DialogTitle>
                        <DialogDescription>
                            You need to be part of an organization to create a
                            class. Please create or join an organization first.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" asChild>
                            <Link to="/organizations">Go to Organizations</Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Class</DialogTitle>
                        <DialogDescription>
                            Create a new class to manage students and
                            assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {organizations.length > 1 && (
                            <Field>
                                <FieldLabel htmlFor="org-select">
                                    Organization *
                                </FieldLabel>
                                <FieldContent>
                                    <Select
                                        value={selectedOrgId}
                                        onValueChange={setSelectedOrgId}
                                        required
                                    >
                                        <SelectTrigger id="org-select">
                                            <SelectValue placeholder="Select an organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map((org) => (
                                                <SelectItem
                                                    key={org.id}
                                                    value={org.id}
                                                >
                                                    {org.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldDescription>
                                        Select the organization for this class
                                    </FieldDescription>
                                </FieldContent>
                            </Field>
                        )}
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
                            <FieldLabel htmlFor="class-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="class-description"
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
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Class"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
