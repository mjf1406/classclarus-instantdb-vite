/** @format */

import { useState, useEffect, useMemo } from "react";
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
import { StudentMultiSelect } from "./student-multi-select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Group = InstaQLEntity<
    AppSchema,
    "groups",
    {
        groupStudents: {};
        groupTeams: { teamStudents: {} };
    }
>;
type Student = InstaQLEntity<AppSchema, "$users">;

interface EditTeamDialogProps {
    children?: React.ReactNode;
    team: InstaQLEntity<
        AppSchema,
        "teams",
        {
            teamStudents: {};
        }
    >;
    group: Group;
    asDropdownItem?: boolean;
}

export function EditTeamDialog({
    children,
    team,
    group,
    asDropdownItem = false,
}: EditTeamDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
        new Set()
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get students from the group
    const availableStudents = group?.groupStudents || [];

    // Get existing teams in the group for quick-select (excluding current team)
    const existingTeams =
        group?.groupTeams?.filter((t) => t.id !== team.id) || [];

    // Build quick-select options: "Select students not in Team X"
    const quickSelectOptions = useMemo(() => {
        return existingTeams.map((t) => {
            const teamStudentIds = new Set(
                t.teamStudents?.map((s) => s.id) || []
            );
            return {
                id: t.id,
                label: `Select students not in ${t.name}`,
                filterFn: (student: Student) => !teamStudentIds.has(student.id),
            };
        });
    }, [existingTeams]);

    // Initialize form with team data
    useEffect(() => {
        if (open && team) {
            setName(team.name || "");
            setDescription(team.description || "");
            const currentStudentIds = new Set(
                team.teamStudents?.map((s) => s.id) || []
            );
            setSelectedStudentIds(currentStudentIds);
        }
    }, [open, team]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Team name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            const currentStudentIds = new Set(
                team.teamStudents?.map((s) => s.id) || []
            );

            // Determine which students to add and remove
            const studentsToAdd = Array.from(selectedStudentIds).filter(
                (id) => !currentStudentIds.has(id)
            );
            const studentsToRemove = Array.from(currentStudentIds).filter(
                (id) => !selectedStudentIds.has(id)
            );

            // Build transaction array
            const transactions = [
                // Update team entity
                db.tx.teams[team.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    updated: now,
                }),
                // Unlink removed students
                ...studentsToRemove.map((studentId) =>
                    db.tx.teams[team.id].unlink({ teamStudents: studentId })
                ),
                // Link added students
                ...studentsToAdd.map((studentId) =>
                    db.tx.teams[team.id].link({ teamStudents: studentId })
                ),
            ];

            db.transact(transactions);

            // Close dialog
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update team"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset form when closing
            setName("");
            setDescription("");
            setSelectedStudentIds(new Set());
            setError(null);
        }
    };

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
                    <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Team</DialogTitle>
                        <DialogDescription>
                            Update team details and student assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="edit-team-name">
                                Name *
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="edit-team-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Team Name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="edit-team-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="edit-team-description"
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
                            <FieldLabel>Group</FieldLabel>
                            <FieldContent>
                                <Input
                                    value={group?.name || ""}
                                    disabled
                                    className="bg-muted"
                                />
                            </FieldContent>
                        </Field>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Students</span>
                                <span className="text-sm text-muted-foreground">
                                    {selectedStudentIds.size} selected
                                </span>
                            </div>
                            <StudentMultiSelect
                                students={availableStudents}
                                selectedStudentIds={selectedStudentIds}
                                onSelectionChange={setSelectedStudentIds}
                                availableStudents={availableStudents}
                                quickSelectOptions={quickSelectOptions}
                                label=""
                                description="Select students from the group to add to this team. Use quick select to choose students not in other teams."
                            />
                        </div>

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
                            {isSubmitting ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                {children}
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Team</DialogTitle>
                        <DialogDescription>
                            Update team details and student assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="edit-team-name">
                                Name *
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="edit-team-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Team Name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="edit-team-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="edit-team-description"
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
                            <FieldLabel>Group</FieldLabel>
                            <FieldContent>
                                <Input
                                    value={group?.name || ""}
                                    disabled
                                    className="bg-muted"
                                />
                            </FieldContent>
                        </Field>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Students</span>
                                <span className="text-sm text-muted-foreground">
                                    {selectedStudentIds.size} selected
                                </span>
                            </div>
                            <StudentMultiSelect
                                students={availableStudents}
                                selectedStudentIds={selectedStudentIds}
                                onSelectionChange={setSelectedStudentIds}
                                availableStudents={availableStudents}
                                quickSelectOptions={quickSelectOptions}
                                label=""
                                description="Select students from the group to add to this team. Use quick select to choose students not in other teams."
                            />
                        </div>

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
                            {isSubmitting ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
