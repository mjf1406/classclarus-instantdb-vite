/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import {
    Credenza,
    CredenzaTrigger,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ScopeSelection } from "./scope-filter-select";

interface CreatePickerInstanceDialogProps {
    children: React.ReactNode;
    classId: string;
    groups: InstaQLEntity<AppSchema, "groups", { groupTeams?: {} }>[];
}

export function CreatePickerInstanceDialog({
    children,
    classId,
    groups,
}: CreatePickerInstanceDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [scope, setScope] = useState<ScopeSelection>({
        type: "class",
        id: classId,
        name: "All Students",
    });
    const [selectedGroupId, setSelectedGroupId] = useState<string>(classId);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedGroup = groups.find((g) => g.id === selectedGroupId);
    const teams = selectedGroup?.groupTeams ?? [];

    const handleGroupChange = (groupId: string) => {
        setSelectedGroupId(groupId);
        setSelectedTeamId(null);
        if (groupId === classId) {
            setScope({ type: "class", id: classId, name: "All Students" });
        } else {
            const group = groups.find((g) => g.id === groupId);
            if (group) {
                setScope({
                    type: "group",
                    id: groupId,
                    name: group.name ?? "Unnamed Group",
                });
            }
        }
    };

    const handleTeamChange = (teamId: string) => {
        setSelectedTeamId(teamId);
        const team = teams.find((t) => t.id === teamId);
        if (team && selectedGroup) {
            setScope({
                type: "team",
                id: teamId,
                name: team.name ?? "Unnamed Team",
                parentGroupName: selectedGroup.name ?? "Unnamed Group",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const instanceId = id();
            const now = new Date();

            const createTx = db.tx.picker_instances[instanceId].create({
                name: name.trim(),
                scopeType: scope.type,
                scopeId: scope.id,
                scopeName: scope.name,
                created: now,
                updated: now,
            });
            const linkTx = db.tx.picker_instances[instanceId].link({
                class: classId,
            });
            db.transact([createTx, linkTx]);

            // Reset form and close dialog
            setName("");
            setScope({ type: "class", id: classId, name: "All Students" });
            setSelectedGroupId(classId);
            setSelectedTeamId(null);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create picker instance"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setName("");
            setScope({ type: "class", id: classId, name: "All Students" });
            setSelectedGroupId(classId);
            setSelectedTeamId(null);
            setError(null);
        }
    };

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col h-full min-h-0 overflow-hidden"
                >
                    <CredenzaHeader className="shrink-0">
                        <CredenzaTitle>Create Picker</CredenzaTitle>
                        <CredenzaDescription>
                            Create a new named picker instance with a fixed scope.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="space-y-4 pr-4 pb-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Friday Helper, Board Cleaner"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Scope</Label>
                                    <RadioGroup
                                        value={selectedGroupId}
                                        onValueChange={handleGroupChange}
                                        disabled={isSubmitting}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={classId} id="scope-class" />
                                            <Label htmlFor="scope-class" className="cursor-pointer">
                                                All Students
                                            </Label>
                                        </div>
                                        {groups.map((g) => (
                                            <div key={g.id} className="flex items-center space-x-2">
                                                <RadioGroupItem value={g.id} id={`scope-group-${g.id}`} />
                                                <Label htmlFor={`scope-group-${g.id}`} className="cursor-pointer">
                                                    {g.name ?? "Unnamed Group"}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>

                                    {selectedGroupId !== classId && teams.length > 0 && (
                                        <div className="ml-6 space-y-2">
                                            <Label className="text-sm text-muted-foreground">Team (optional)</Label>
                                            <RadioGroup
                                                value={selectedTeamId ?? classId}
                                                onValueChange={(value) => {
                                                    if (value === classId) {
                                                        setSelectedTeamId(null);
                                                        const group = groups.find((g) => g.id === selectedGroupId);
                                                        if (group) {
                                                            setScope({
                                                                type: "group",
                                                                id: selectedGroupId,
                                                                name: group.name ?? "Unnamed Group",
                                                            });
                                                        }
                                                    } else {
                                                        handleTeamChange(value);
                                                    }
                                                }}
                                                disabled={isSubmitting}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value={classId} id="team-all" />
                                                    <Label htmlFor="team-all" className="cursor-pointer text-sm">
                                                        All in Group
                                                    </Label>
                                                </div>
                                                {teams.map((t) => (
                                                    <div key={t.id} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={t.id} id={`team-${t.id}`} />
                                                        <Label htmlFor={`team-${t.id}`} className="cursor-pointer text-sm">
                                                            {t.name ?? "Unnamed Team"}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="text-sm text-destructive">{error}</div>
                                )}
                            </div>
                        </ScrollArea>
                    </CredenzaBody>
                    <CredenzaFooter className="shrink-0">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Picker"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
