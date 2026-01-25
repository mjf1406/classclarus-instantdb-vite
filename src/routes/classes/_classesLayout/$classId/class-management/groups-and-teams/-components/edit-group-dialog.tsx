/** @format */

import { useState, useEffect, useMemo } from "react";
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
import { StudentMultiSelect } from "./student-multi-select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface EditGroupDialogProps {
    children?: React.ReactNode;
    group: InstaQLEntity<
        AppSchema,
        "groups",
        {
            class: {};
            groupStudents: {};
        }
    >;
    classId: string;
    asDropdownItem?: boolean;
}

type Group = InstaQLEntity<AppSchema, "groups", { groupStudents: {} }>;
type Student = InstaQLEntity<AppSchema, "$users">;
type Class = InstaQLEntity<AppSchema, "classes", { classStudents: {} }>;

type GroupsQueryResult = {
    groups: Group[];
};

type ClassQueryResult = {
    classes: Class[];
};

export function EditGroupDialog({
    children,
    group,
    classId,
    asDropdownItem = false,
}: EditGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
        new Set()
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Query all class students
    const { data: classData } = db.useQuery(
        classId
            ? {
                  classes: {
                      $: { where: { id: classId } },
                      classStudents: {},
                  },
              }
            : null
    );

    // Query all existing groups for quick-select options (excluding current group)
    const { data: groupsData } = db.useQuery(
        classId
            ? {
                  groups: {
                      $: {
                          where: { "class.id": classId },
                      },
                      groupStudents: {},
                  },
              }
            : null
    );

    const typedClassData = (classData as ClassQueryResult | undefined) ?? null;
    const students = typedClassData?.classes?.[0]?.classStudents || [];

    const typedGroupsData =
        (groupsData as GroupsQueryResult | undefined) ?? null;
    const existingGroups =
        typedGroupsData?.groups?.filter((g) => g.id !== group.id) || [];

    // Build quick-select options: "Select students not in Group X"
    const quickSelectOptions = useMemo(() => {
        return existingGroups.map((g) => {
            const groupStudentIds = new Set(
                g.groupStudents?.map((s) => s.id) || []
            );
            return {
                id: g.id,
                label: `Select students not in ${g.name}`,
                filterFn: (student: Student) => !groupStudentIds.has(student.id),
            };
        });
    }, [existingGroups]);

    // Initialize form with group data
    useEffect(() => {
        if (open && group) {
            setName(group.name || "");
            setDescription(group.description || "");
            const currentStudentIds = new Set(
                group.groupStudents?.map((s) => s.id) || []
            );
            setSelectedStudentIds(currentStudentIds);
        }
    }, [open, group]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Group name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            const currentStudentIds = new Set(
                group.groupStudents?.map((s) => s.id) || []
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
                // Update group entity
                db.tx.groups[group.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    updated: now,
                }),
                // Unlink removed students and create removal history records
                ...studentsToRemove.flatMap((studentId) => {
                    const historyId = id();
                    return [
                        db.tx.groups[group.id].unlink({ groupStudents: studentId }),
                        db.tx.group_membership_history[historyId]
                            .create({ addedAt: now, action: "removed" })
                            .link({ student: studentId, group: group.id, class: classId }),
                    ];
                }),
                // Link added students and create history records
                ...studentsToAdd.flatMap((studentId) => {
                    const historyId = id();
                    return [
                        db.tx.groups[group.id].link({ groupStudents: studentId }),
                        db.tx.group_membership_history[historyId]
                            .create({ addedAt: now, action: "added" })
                            .link({ student: studentId, group: group.id, class: classId }),
                    ];
                }),
            ];

            db.transact(transactions);

            // Close dialog
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update group"
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
                        <DialogTitle>Edit Group</DialogTitle>
                        <DialogDescription>
                            Update group details and student assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="edit-group-name">
                                Name *
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="edit-group-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Group Name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="edit-group-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="edit-group-description"
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Students</span>
                                <span className="text-sm text-muted-foreground">
                                    {selectedStudentIds.size} selected
                                </span>
                            </div>
                            <StudentMultiSelect
                                students={students}
                                selectedStudentIds={selectedStudentIds}
                                onSelectionChange={setSelectedStudentIds}
                                quickSelectOptions={quickSelectOptions}
                                label=""
                                description="Select students to add to this group. Use quick select to choose students not in other groups."
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
                        <DialogTitle>Edit Group</DialogTitle>
                        <DialogDescription>
                            Update group details and student assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="edit-group-name">
                                Name *
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="edit-group-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Group Name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="edit-group-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="edit-group-description"
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Students</span>
                                <span className="text-sm text-muted-foreground">
                                    {selectedStudentIds.size} selected
                                </span>
                            </div>
                            <StudentMultiSelect
                                students={students}
                                selectedStudentIds={selectedStudentIds}
                                onSelectionChange={setSelectedStudentIds}
                                quickSelectOptions={quickSelectOptions}
                                label=""
                                description="Select students to add to this group. Use quick select to choose students not in other groups."
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
