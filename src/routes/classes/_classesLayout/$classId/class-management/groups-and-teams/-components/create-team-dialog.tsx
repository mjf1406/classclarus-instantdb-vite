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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { StudentMultiSelect } from "./student-multi-select";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface CreateTeamDialogProps {
    children: React.ReactNode;
    classId: string;
    groupId?: string; // Optional - if provided, pre-select this group
}

type Group = InstaQLEntity<
    AppSchema,
    "groups",
    {
        class: {};
        groupStudents: {};
        groupTeams: { teamStudents: {} };
    }
>;
type Student = InstaQLEntity<AppSchema, "$users">;

type GroupsQueryResult = {
    groups: Group[];
};

export function CreateTeamDialog({
    children,
    classId,
    groupId: providedGroupId,
}: CreateTeamDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState<string>(
        providedGroupId || ""
    );
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
        new Set()
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Query all groups in the class
    const { data: groupsData } = db.useQuery(
        classId
            ? {
                  groups: {
                      $: {
                          where: { "class.id": classId },
                      },
                      groupStudents: {},
                      groupTeams: {
                          teamStudents: {},
                      },
                  },
              }
            : null
    );

    const typedGroupsData =
        (groupsData as GroupsQueryResult | undefined) ?? null;
    const groups = typedGroupsData?.groups || [];

    // Get selected group
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);

    // Get students from selected group
    const availableStudents = selectedGroup?.groupStudents || [];

    // Get existing teams in the selected group for quick-select
    const existingTeams = selectedGroup?.groupTeams || [];

    // Build quick-select options: "Select students not in Team X"
    const quickSelectOptions = useMemo(() => {
        if (!selectedGroup) return [];
        return existingTeams.map((team) => {
            const teamStudentIds = new Set(
                team.teamStudents?.map((s) => s.id) || []
            );
            return {
                id: team.id,
                label: `Select students not in ${team.name}`,
                filterFn: (student: Student) => !teamStudentIds.has(student.id),
            };
        });
    }, [existingTeams, selectedGroup]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Team name is required");
            return;
        }

        if (!selectedGroupId) {
            setError("Please select a group");
            return;
        }

        setIsSubmitting(true);

        try {
            const teamId = id();
            const now = new Date();

            // Create team entity
            const createTx = db.tx.teams[teamId].create({
                name: name.trim(),
                description: description.trim() || undefined,
                created: now,
                updated: now,
            });

            // Build transaction array
            const transactions = [
                createTx,
                db.tx.teams[teamId].link({ group: selectedGroupId }),
                // Link selected students
                ...Array.from(selectedStudentIds).map((studentId) =>
                    db.tx.teams[teamId].link({ teamStudents: studentId })
                ),
            ];

            db.transact(transactions);

            // Reset form and close dialog
            setName("");
            setDescription("");
            setSelectedStudentIds(new Set());
            if (!providedGroupId) {
                setSelectedGroupId("");
            }
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create team"
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
            if (!providedGroupId) {
                setSelectedGroupId("");
            }
            setError(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Team</DialogTitle>
                        <DialogDescription>
                            Create a new team within a group and assign students to it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel htmlFor="team-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="team-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Team Name"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="team-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="team-description"
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
                            <FieldLabel htmlFor="team-group">Group *</FieldLabel>
                            <FieldContent>
                                <Select
                                    value={selectedGroupId}
                                    onValueChange={setSelectedGroupId}
                                    disabled={!!providedGroupId || isSubmitting}
                                >
                                    <SelectTrigger id="team-group">
                                        <SelectValue placeholder="Select a group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.length === 0 ? (
                                            <SelectItem value="" disabled>
                                                No groups available
                                            </SelectItem>
                                        ) : (
                                            groups.map((group) => (
                                                <SelectItem
                                                    key={group.id}
                                                    value={group.id}
                                                >
                                                    {group.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>

                        {selectedGroup && (
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
                        )}

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
                            {isSubmitting ? "Creating..." : "Create Team"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
