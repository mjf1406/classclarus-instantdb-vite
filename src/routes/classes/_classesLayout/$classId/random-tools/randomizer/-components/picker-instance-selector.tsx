/** @format */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { CreatePickerInstanceDialog } from "./create-picker-instance-dialog";

interface PickerInstanceSelectorProps {
    classId: string;
    instances: InstaQLEntity<AppSchema, "picker_instances", {}>[];
    selectedInstanceId: string | null;
    onInstanceChange: (instanceId: string | null) => void;
    groups: InstaQLEntity<AppSchema, "groups", { groupTeams?: {} }>[];
}

export function PickerInstanceSelector({
    classId,
    instances,
    selectedInstanceId,
    onInstanceChange,
    groups,
}: PickerInstanceSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <Select
                value={selectedInstanceId ?? undefined}
                onValueChange={(value) => onInstanceChange(value || null)}
            >
                <SelectTrigger className="w-[280px]">
                    <SelectValue
                        placeholder={
                            instances.length === 0
                                ? "Create your first picker"
                                : "Select a picker"
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {instances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                            <div className="flex flex-col">
                                <span className="font-medium">{instance.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {instance.scopeName}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <CreatePickerInstanceDialog classId={classId} groups={groups}>
                <Button variant="outline" size="sm">
                    <Plus className="size-4 mr-2" />
                    New
                </Button>
            </CreatePickerInstanceDialog>
        </div>
    );
}
