/** @format */

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignmentsFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    uniqueSubjects: string[];
    selectedSubjects: Set<string>;
    onSubjectsChange: (subjects: Set<string>) => void;
    uniqueUnits: string[];
    selectedUnits: Set<string>;
    onUnitsChange: (units: Set<string>) => void;
}

export function AssignmentsFilters({
    searchQuery,
    onSearchChange,
    uniqueSubjects,
    selectedSubjects,
    onSubjectsChange,
    uniqueUnits,
    selectedUnits,
    onUnitsChange,
}: AssignmentsFiltersProps) {
    const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
    const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        selectedSubjects.size > 0 ||
        selectedUnits.size > 0;

    const handleSubjectToggle = (subject: string) => {
        const newSubjects = new Set(selectedSubjects);
        if (newSubjects.has(subject)) {
            newSubjects.delete(subject);
        } else {
            newSubjects.add(subject);
        }
        onSubjectsChange(newSubjects);
    };

    const handleUnitToggle = (unit: string) => {
        const newUnits = new Set(selectedUnits);
        if (newUnits.has(unit)) {
            newUnits.delete(unit);
        } else {
            newUnits.add(unit);
        }
        onUnitsChange(newUnits);
    };

    const handleClearAll = () => {
        onSearchChange("");
        onSubjectsChange(new Set());
        onUnitsChange(new Set());
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Subject Filter */}
            {uniqueSubjects.length > 0 && (
                <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-[180px] justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <Filter className="size-4" />
                                Subject
                                {selectedSubjects.size > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {selectedSubjects.size}
                                    </Badge>
                                )}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                        <div className="p-3 border-b">
                            <Label className="text-sm font-medium">Filter by Subject</Label>
                        </div>
                        <ScrollArea className="max-h-[300px]">
                            <div className="p-2 space-y-2">
                                {uniqueSubjects.map((subject) => (
                                    <Label
                                        key={subject}
                                        htmlFor={`subject-${subject}`}
                                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={selectedSubjects.has(subject)}
                                            onCheckedChange={() =>
                                                handleSubjectToggle(subject)
                                            }
                                            id={`subject-${subject}`}
                                        />
                                        <span className="flex-1 text-sm">
                                            {subject}
                                        </span>
                                    </Label>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-2 border-t h-[41px] flex items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    onSubjectsChange(new Set());
                                }}
                                style={{
                                    visibility: selectedSubjects.size > 0 ? "visible" : "hidden",
                                }}
                            >
                                Clear selection
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* Unit Filter */}
            {uniqueUnits.length > 0 && (
                <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-[180px] justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <Filter className="size-4" />
                                Unit
                                {selectedUnits.size > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {selectedUnits.size}
                                    </Badge>
                                )}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                        <div className="p-3 border-b">
                            <Label className="text-sm font-medium">Filter by Unit</Label>
                        </div>
                        <ScrollArea className="max-h-[300px]">
                            <div className="p-2 space-y-2">
                                {uniqueUnits.map((unit) => (
                                    <Label
                                        key={unit}
                                        htmlFor={`unit-${unit}`}
                                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={selectedUnits.has(unit)}
                                            onCheckedChange={() => handleUnitToggle(unit)}
                                            id={`unit-${unit}`}
                                        />
                                        <span className="flex-1 text-sm">
                                            {unit}
                                        </span>
                                    </Label>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-2 border-t h-[41px] flex items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    onUnitsChange(new Set());
                                }}
                                style={{
                                    visibility: selectedUnits.size > 0 ? "visible" : "hidden",
                                }}
                            >
                                Clear selection
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* Clear All Filters Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleClearAll}
                className="w-full sm:w-auto"
                title="Clear all filters"
                style={{ visibility: hasActiveFilters ? "visible" : "hidden" }}
            >
                <X className="size-4" />
            </Button>
        </div>
    );
}
