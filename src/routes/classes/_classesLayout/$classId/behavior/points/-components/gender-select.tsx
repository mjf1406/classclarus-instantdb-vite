/** @format */

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const GENDER_NONE = "__none__";

export const GENDER_OPTIONS = [
    { value: GENDER_NONE, label: "—" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface GenderSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    id?: string;
    className?: string;
    placeholder?: string;
}

export function GenderSelect({
    value,
    onValueChange,
    disabled = false,
    id,
    className,
    placeholder = "Select (optional)",
}: GenderSelectProps) {
    const selectValue = value || GENDER_NONE;
    
    return (
        <Select
            value={selectValue}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <SelectTrigger id={id} className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
