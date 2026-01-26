/** @format */

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export type ScopeSelection =
    | { type: "class"; id: string; name: string }
    | { type: "group"; id: string; name: string }
    | { type: "team"; id: string; name: string; parentGroupName: string };

interface ScopeFilterSelectProps {
    classId: string;
    selectedScope: ScopeSelection;
    onScopeChange: (scope: ScopeSelection) => void;
    groups: InstaQLEntity<
        AppSchema,
        "groups",
        { groupTeams?: {} }
    >[];
}

export function ScopeFilterSelect({
    classId,
    selectedScope,
    onScopeChange,
    groups,
}: ScopeFilterSelectProps) {
    const selectedGroup = groups.find((g) => g.id === selectedScope.id);
    const teams = selectedGroup?.groupTeams ?? [];

    const handleGroupChange = (groupId: string) => {
        if (groupId === classId) {
            onScopeChange({ type: "class", id: classId, name: "All Students" });
        } else {
            const group = groups.find((g) => g.id === groupId);
            if (group) {
                onScopeChange({
                    type: "group",
                    id: groupId,
                    name: group.name ?? "Unnamed Group",
                });
            }
        }
    };

    const handleTeamChange = (teamId: string) => {
        const team = teams.find((t) => t.id === teamId);
        if (team && selectedGroup) {
            onScopeChange({
                type: "team",
                id: teamId,
                name: team.name ?? "Unnamed Team",
                parentGroupName: selectedGroup.name ?? "Unnamed Group",
            });
        }
    };

    const currentGroupId =
        selectedScope.type === "class"
            ? classId
            : selectedScope.type === "group"
              ? selectedScope.id
              : groups.find((g) =>
                    g.groupTeams?.some((t) => t.id === selectedScope.id)
                )?.id ?? classId;

    return (
        <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
                <Label>Filter</Label>
                <RadioGroup
                    value={currentGroupId}
                    onValueChange={handleGroupChange}
                    className="flex flex-wrap gap-3"
                >
                    <label className="flex cursor-pointer items-center gap-2">
                        <RadioGroupItem value={classId} />
                        <span className="text-sm">All</span>
                    </label>
                    {groups.map((g) => (
                        <label
                            key={g.id}
                            className="flex cursor-pointer items-center gap-2"
                        >
                            <RadioGroupItem value={g.id} />
                            <span className="text-sm">{g.name ?? "Unnamed"}</span>
                        </label>
                    ))}
                </RadioGroup>
            </div>

            {currentGroupId !== classId && teams.length > 0 && (
                <div className="space-y-2">
                    <Label>Team</Label>
                    <RadioGroup
                        value={
                            selectedScope.type === "team" ? selectedScope.id : classId
                        }
                        onValueChange={(value) => {
                            if (value === classId) {
                                // Switch back to group view
                                handleGroupChange(currentGroupId);
                            } else {
                                handleTeamChange(value);
                            }
                        }}
                        className="flex flex-wrap gap-3"
                    >
                        <label className="flex cursor-pointer items-center gap-2">
                            <RadioGroupItem value={classId} />
                            <span className="text-sm">All in Group</span>
                        </label>
                        {teams.map((t) => (
                            <label
                                key={t.id}
                                className="flex cursor-pointer items-center gap-2"
                            >
                                <RadioGroupItem value={t.id} />
                                <span className="text-sm">
                                    {t.name ?? "Unnamed"}
                                </span>
                            </label>
                        ))}
                    </RadioGroup>
                </div>
            )}
        </div>
    );
}
