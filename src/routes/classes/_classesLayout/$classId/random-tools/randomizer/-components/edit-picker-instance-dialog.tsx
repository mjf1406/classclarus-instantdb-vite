/** @format */

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ScopeSelection } from "./scope-filter-select";

interface EditPickerInstanceDialogProps {
    children?: React.ReactNode;
    instance: InstaQLEntity<AppSchema, "picker_instances", {}>;
    classId: string;
    groups: InstaQLEntity<AppSchema, "groups", { groupTeams?: {} }>[];
    asDropdownItem?: boolean;
}

export function EditPickerInstanceDialog({
    children,
    instance,
    classId,
    groups,
    asDropdownItem = false,
}: EditPickerInstanceDialogProps) {
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

    useEffect(() => {
        if (open && instance) {
            setName(instance.name || "");
            
            if (instance.scopeType === "class") {
                setSelectedGroupId(classId);
                setSelectedTeamId(null);
                setScope({
                    type: "class",
                    id: instance.scopeId,
                    name: instance.scopeName,
                });
            } else if (instance.scopeType === "group") {
                setSelectedGroupId(instance.scopeId);
                setSelectedTeamId(null);
                setScope({
                    type: "group",
                    id: instance.scopeId,
                    name: instance.scopeName,
                });
            } else {
                // team
                const parentGroup = groups.find((g) =>
                    g.groupTeams?.some((t) => t.id === instance.scopeId)
                );
                if (parentGroup) {
                    setSelectedGroupId(parentGroup.id);
                    setSelectedTeamId(instance.scopeId);
                    setScope({
                        type: "team",
                        id: instance.scopeId,
                        name: instance.scopeName,
                        parentGroupName: parentGroup.name ?? "Unnamed Group",
                    });
                } else {
                    setSelectedGroupId(classId);
                    setSelectedTeamId(null);
                    setScope({
                        type: "class",
                        id: classId,
                        name: "All Students",
                    });
                }
            }
        }
    }, [open, instance, classId, groups]);

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
            await db.transact([
                db.tx.picker_instances[instance.id].update({
                    name: name.trim(),
                    scopeType: scope.type,
                    scopeId: scope.id,
                    scopeName: scope.name,
                    updated: new Date(),
                }),
            ]);

            // Reset form and close dialog
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update picker instance"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setError(null);
        }
    };

    const trigger = asDropdownItem ? (
        <DropdownMenuItem
            onSelect={(e) => {
                e.preventDefault();
                setOpen(true);
            }}
            className="flex items-center gap-2"
        >
            <Pencil className="size-4" />
            {children || "Edit"}
        </DropdownMenuItem>
    ) : (
        children
    );

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{trigger}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col h-full min-h-0 overflow-hidden"
                >
                    <CredenzaHeader className="shrink-0">
                        <CredenzaTitle>Edit Picker</CredenzaTitle>
                        <CredenzaDescription>
                            Update the name and scope of this picker instance.
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
                            {isSubmitting ? "Updating..." : "Update Picker"}
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
