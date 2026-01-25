/** @format */

import { useState, useMemo } from "react";
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
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface CreateGroupDialogProps {
    children: React.ReactNode;
    classId: string;
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

export function CreateGroupDialog({
    children,
    classId,
}: CreateGroupDialogProps) {
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

    // Query all existing groups for quick-select options
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
    const existingGroups = typedGroupsData?.groups || [];

    // Build quick-select options: "Select students not in Group X"
    const quickSelectOptions = useMemo(() => {
        return existingGroups.map((group) => {
            const groupStudentIds = new Set(
                group.groupStudents?.map((s) => s.id) || []
            );
            return {
                id: group.id,
                label: `Select students not in ${group.name}`,
                filterFn: (student: Student) => !groupStudentIds.has(student.id),
            };
        });
    }, [existingGroups]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Group name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const groupId = id();
            const now = new Date();

            // Create group entity
            const createTx = db.tx.groups[groupId].create({
                name: name.trim(),
                description: description.trim() || undefined,
                created: now,
                updated: now,
            });

            // Build transaction array
            const transactions = [
                createTx,
                db.tx.groups[groupId].link({ class: classId }),
                // Link selected students and create history records
                ...Array.from(selectedStudentIds).flatMap((studentId) => {
                    const historyId = id();
                    return [
                        db.tx.groups[groupId].link({ groupStudents: studentId }),
                        db.tx.group_membership_history[historyId]
                            .create({ addedAt: now, action: "added" })
                            .link({ student: studentId, group: groupId, class: classId }),
                    ];
                }),
            ];

            db.transact(transactions);

            // Reset form and close dialog
            setName("");
            setDescription("");
            setSelectedStudentIds(new Set());
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create group"
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Group</DialogTitle>
                        <DialogDescription>
                            Create a new group and assign students to it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="group-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="group-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Group Name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="group-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="group-description"
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
                            {isSubmitting ? "Creating..." : "Create Group"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
