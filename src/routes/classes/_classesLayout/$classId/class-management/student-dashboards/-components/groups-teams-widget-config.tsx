/** @format */

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type GroupsTeamsDisplayOption = "none" | "groups" | "groups-and-teams";

interface GroupsTeamsWidgetConfigProps {
    value?: GroupsTeamsDisplayOption;
    onChange?: (value: GroupsTeamsDisplayOption) => void;
}

export function GroupsTeamsWidgetConfig({
    value = "none",
    onChange,
}: GroupsTeamsWidgetConfigProps) {
    const [selectedOption, setSelectedOption] = useState<GroupsTeamsDisplayOption>(value);

    // Sync internal state with prop value
    useEffect(() => {
        if (value !== undefined) {
            setSelectedOption(value);
        }
    }, [value]);

    const handleValueChange = (newValue: string) => {
        const option = newValue as GroupsTeamsDisplayOption;
        setSelectedOption(option);
        onChange?.(option);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    <CardTitle>Groups & Teams Widget</CardTitle>
                </div>
                <CardDescription>
                    Configure how groups and teams are displayed on student dashboards
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <Label>Display Options</Label>
                    <RadioGroup
                        value={selectedOption}
                        onValueChange={handleValueChange}
                        className="space-y-3"
                    >
                        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <RadioGroupItem value="none" id="none" className="mt-0.5" />
                            <div className="space-y-1 leading-none">
                                <Label
                                    htmlFor="none"
                                    className="font-medium cursor-pointer"
                                >
                                    None
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Do not show groups or teams on student dashboards
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <RadioGroupItem value="groups" id="groups" className="mt-0.5" />
                            <div className="space-y-1 leading-none">
                                <Label
                                    htmlFor="groups"
                                    className="font-medium cursor-pointer"
                                >
                                    Groups Only
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show only groups on student dashboards
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                            <RadioGroupItem
                                value="groups-and-teams"
                                id="groups-and-teams"
                                className="mt-0.5"
                            />
                            <div className="space-y-1 leading-none">
                                <Label
                                    htmlFor="groups-and-teams"
                                    className="font-medium cursor-pointer"
                                >
                                    Groups and Teams
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show both groups and teams on student dashboards
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>
    );
}
