/** @format */

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Users, Users2 } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type {
    SelectedItem,
    Group,
} from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/-components/groups-teams-pdf-document";

type AssignerEntity =
    | InstaQLEntity<AppSchema, "random_assigners", { class: {} }>
    | InstaQLEntity<AppSchema, "rotating_assigners", { class: {} }>
    | InstaQLEntity<AppSchema, "equitable_assigners", { class: {} }>;

interface RunAssignerDialogProps {
    children: React.ReactNode;
    assigner: AssignerEntity;
    groups: Group[];
    onRunAssigner: (
        assignerId: string,
        selectedItems: SelectedItem[],
        shouldExport: boolean,
    ) => void | Promise<void>;
}

type SelectionState = {
    groups: Set<string>;
    teams: Set<string>;
};

export function RunAssignerDialog({
    children,
    assigner,
    groups,
    onRunAssigner,
}: RunAssignerDialogProps) {
    const [open, setOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selection, setSelection] = useState<SelectionState>({
        groups: new Set(),
        teams: new Set(),
    });

    // Build a map of team id to parent group for quick lookup
    const teamToGroupMap = useMemo(() => {
        const map = new Map<string, Group>();
        for (const group of groups) {
            for (const team of group.groupTeams || []) {
                map.set(team.id, group);
            }
        }
        return map;
    }, [groups]);

    const toggleGroup = (groupId: string) => {
        setSelection((prev) => {
            const newGroups = new Set(prev.groups);
            const newTeams = new Set(prev.teams);

            if (newGroups.has(groupId)) {
                newGroups.delete(groupId);
            } else {
                newGroups.add(groupId);
                // When selecting a group, deselect its teams (they're included in the group)
                const group = groups.find((g) => g.id === groupId);
                if (group) {
                    for (const team of group.groupTeams || []) {
                        newTeams.delete(team.id);
                    }
                }
            }

            return { groups: newGroups, teams: newTeams };
        });
    };

    const toggleTeam = (teamId: string, groupId: string) => {
        setSelection((prev) => {
            const newTeams = new Set(prev.teams);
            const newGroups = new Set(prev.groups);

            if (newTeams.has(teamId)) {
                newTeams.delete(teamId);
            } else {
                newTeams.add(teamId);
                // When selecting a team, deselect its parent group if selected
                newGroups.delete(groupId);
            }

            return { groups: newGroups, teams: newTeams };
        });
    };

    const selectAll = () => {
        setSelection({
            groups: new Set(groups.map((g) => g.id)),
            teams: new Set(),
        });
    };

    const selectNone = () => {
        setSelection({ groups: new Set(), teams: new Set() });
    };

    const hasSelection = selection.groups.size > 0 || selection.teams.size > 0;

    const totalSelected = selection.groups.size + selection.teams.size;

    const buildSelectedItems = (): SelectedItem[] => {
        const items: SelectedItem[] = [];

        // Add selected groups
        for (const groupId of selection.groups) {
            const group = groups.find((g) => g.id === groupId);
            if (group) {
                items.push({ type: "group", group });
            }
        }

        // Add selected teams (that aren't part of a selected group)
        for (const teamId of selection.teams) {
            const parentGroup = teamToGroupMap.get(teamId);
            if (parentGroup && !selection.groups.has(parentGroup.id)) {
                const team = parentGroup.groupTeams?.find(
                    (t) => t.id === teamId,
                );
                if (team) {
                    items.push({
                        type: "team",
                        team,
                        parentGroupName: parentGroup.name,
                    });
                }
            }
        }

        return items;
    };

    const handleRunAssigner = async (shouldExport: boolean) => {
        if (!hasSelection) return;

        setIsRunning(true);
        setError(null); // Clear previous error

        try {
            const selectedItems = buildSelectedItems();
            await onRunAssigner(assigner.id, selectedItems, shouldExport);
            setOpen(false);
        } catch (err) {
            // Display error to user instead of just logging
            const message = err instanceof Error ? err.message : "Failed to run assigner";
            setError(message);
        } finally {
            setIsRunning(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset selection and error when closing
            setSelection({ groups: new Set(), teams: new Set() });
            setError(null);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Run Assigner: {assigner.name}</DialogTitle>
                    <DialogDescription>
                        Select the groups and teams to run this assigner for.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">
                            {totalSelected} selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={selectAll}
                            >
                                Select All
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={selectNone}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-75 rounded-md border p-3">
                        <div className="space-y-4">
                            {groups.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No groups available to run assigner for.
                                </p>
                            ) : (
                                groups.map((group) => {
                                    const isGroupSelected =
                                        selection.groups.has(group.id);
                                    const teams = group.groupTeams || [];

                                    return (
                                        <div
                                            key={group.id}
                                            className="space-y-2"
                                        >
                                            {/* Group checkbox */}
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`group-${group.id}`}
                                                    checked={isGroupSelected}
                                                    onCheckedChange={() =>
                                                        toggleGroup(group.id)
                                                    }
                                                />
                                                <label
                                                    htmlFor={`group-${group.id}`}
                                                    className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1"
                                                >
                                                    <Users className="size-4 text-primary" />
                                                    {group.name}
                                                    <span className="text-muted-foreground font-normal">
                                                        (
                                                        {group.groupStudents
                                                            ?.length || 0}{" "}
                                                        students)
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Team checkboxes */}
                                            {teams.length > 0 && (
                                                <div className="ml-6 space-y-1.5 border-l-2 border-muted pl-3">
                                                    {teams.map((team) => {
                                                        const isTeamSelected =
                                                            selection.teams.has(
                                                                team.id,
                                                            );
                                                        const isTeamDisabled =
                                                            isGroupSelected;

                                                        return (
                                                            <div
                                                                key={team.id}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Checkbox
                                                                    id={`team-${team.id}`}
                                                                    checked={
                                                                        isTeamSelected ||
                                                                        isGroupSelected
                                                                    }
                                                                    disabled={
                                                                        isTeamDisabled
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        toggleTeam(
                                                                            team.id,
                                                                            group.id,
                                                                        )
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={`team-${team.id}`}
                                                                    className={`flex items-center gap-2 text-sm cursor-pointer flex-1 ${
                                                                        isTeamDisabled
                                                                            ? "text-muted-foreground"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <Users2 className="size-3.5 text-primary/70" />
                                                                    {team.name}
                                                                    <span className="text-muted-foreground text-xs">
                                                                        (
                                                                        {team
                                                                            .teamStudents
                                                                            ?.length ||
                                                                            0}
                                                                        )
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <DialogFooter className="flex-col! gap-2">
                    <div className="flex gap-2 w-full">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleRunAssigner(false)}
                            disabled={!hasSelection || isRunning}
                            className="flex-1"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                "Run Assigner"
                            )}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleRunAssigner(true)}
                            disabled={!hasSelection || isRunning}
                            className="flex-1"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                "Run Assigner and Export"
                            )}
                        </Button>
                    </div>
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isRunning}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
