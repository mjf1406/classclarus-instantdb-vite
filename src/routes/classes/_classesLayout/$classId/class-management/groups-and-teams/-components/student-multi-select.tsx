/** @format */

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field";
import { X, Search } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Student = InstaQLEntity<AppSchema, "$users">;

interface QuickSelectOption {
    id: string;
    label: string;
    filterFn: (student: Student) => boolean;
}

interface StudentMultiSelectProps {
    students: Student[];
    selectedStudentIds: Set<string>;
    onSelectionChange: (selectedIds: Set<string>) => void;
    availableStudents?: Student[]; // For filtering (e.g., only students in a group)
    quickSelectOptions?: QuickSelectOption[];
    label?: string;
    description?: string;
}

export function StudentMultiSelect({
    students,
    selectedStudentIds,
    onSelectionChange,
    availableStudents,
    quickSelectOptions,
    label = "Students",
    description,
}: StudentMultiSelectProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [quickSelectValue, setQuickSelectValue] = useState<string>("");

    // Filter students based on availableStudents if provided
    const filteredStudents = useMemo(() => {
        let filtered = availableStudents || students;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((student) => {
                const firstName = (student.firstName || "").toLowerCase();
                const lastName = (student.lastName || "").toLowerCase();
                const email = (student.email || "").toLowerCase();
                return (
                    firstName.includes(query) ||
                    lastName.includes(query) ||
                    email.includes(query)
                );
            });
        }

        return filtered;
    }, [students, availableStudents, searchQuery]);

    const handleToggleStudent = (studentId: string) => {
        const newSelection = new Set(selectedStudentIds);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        onSelectionChange(newSelection);
    };

    const handleQuickSelect = (optionId: string) => {
        if (!quickSelectOptions) return;

        const option = quickSelectOptions.find((opt) => opt.id === optionId);
        if (!option) return;

        const filtered = filteredStudents.filter(option.filterFn);
        const newSelection = new Set(selectedStudentIds);

        // Add all filtered students to selection
        filtered.forEach((student) => {
            newSelection.add(student.id);
        });

        onSelectionChange(newSelection);
        setQuickSelectValue("");
    };

    const handleRemoveStudent = (studentId: string) => {
        const newSelection = new Set(selectedStudentIds);
        newSelection.delete(studentId);
        onSelectionChange(newSelection);
    };

    const selectedStudents = useMemo(() => {
        return students.filter((student) => selectedStudentIds.has(student.id));
    }, [students, selectedStudentIds]);

    const getStudentDisplayName = (student: Student) => {
        const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();
        return name || student.email || "Unknown Student";
    };

    return (
        <Field>
            <FieldLabel>{label}</FieldLabel>
            <FieldContent>
                <div className="space-y-4">
                    {/* Quick Select Dropdown */}
                    {quickSelectOptions && quickSelectOptions.length > 0 && (
                        <div>
                            <Select
                                value={quickSelectValue}
                                onValueChange={handleQuickSelect}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Quick select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {quickSelectOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {/* Selected Students Badges */}
                    {selectedStudents.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-12">
                            {selectedStudents.map((student) => (
                                <Badge
                                    key={student.id}
                                    variant="secondary"
                                    className="flex items-center gap-1 pr-1"
                                >
                                    <Avatar className="size-4">
                                        <AvatarImage
                                            src={student.avatarURL || student.imageURL}
                                        />
                                        <AvatarFallback className="text-xs">
                                            {getStudentDisplayName(student)
                                                .charAt(0)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">
                                        {getStudentDisplayName(student)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="size-4 h-4 w-4 rounded-full hover:bg-destructive/20"
                                        onClick={() => handleRemoveStudent(student.id)}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Student List with Checkboxes */}
                    <div className="border rounded-md max-h-64 overflow-y-auto">
                        {filteredStudents.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {searchQuery
                                    ? "No students found matching your search."
                                    : "No students available."}
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {filteredStudents.map((student) => {
                                    const isSelected = selectedStudentIds.has(
                                        student.id
                                    );
                                    return (
                                        <label
                                            key={student.id}
                                            className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                    handleToggleStudent(student.id)
                                                }
                                                className="rounded"
                                            />
                                            <Avatar className="size-6">
                                                <AvatarImage
                                                    src={
                                                        student.avatarURL ||
                                                        student.imageURL
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {getStudentDisplayName(student)
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="flex-1 text-sm">
                                                {getStudentDisplayName(student)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                {description && (
                    <FieldDescription>{description}</FieldDescription>
                )}
            </FieldContent>
        </Field>
    );
}
