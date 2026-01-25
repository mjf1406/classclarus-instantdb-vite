/** @format */

import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type AssignerType = "random" | "rotating" | "equitable";

interface AssignerFormProps {
    assignerType: AssignerType;
    name: string;
    itemsText: string;
    balanceGender: boolean;
    direction?: "front-to-back" | "back-to-front";
    onNameChange: (name: string) => void;
    onItemsTextChange: (text: string) => void;
    onBalanceGenderChange: (checked: boolean) => void;
    onDirectionChange?: (direction: "front-to-back" | "back-to-front") => void;
    disabled?: boolean;
    error?: string | null;
}

export function AssignerForm({
    assignerType,
    name,
    itemsText,
    balanceGender,
    direction = "front-to-back",
    onNameChange,
    onItemsTextChange,
    onBalanceGenderChange,
    onDirectionChange,
    disabled = false,
    error,
}: AssignerFormProps) {
    const showBalanceGender = assignerType === "rotating" || assignerType === "equitable";
    const showDirection = assignerType === "rotating";

    return (
        <div className="space-y-4">
            <Field>
                <FieldLabel htmlFor="assigner-name">Name *</FieldLabel>
                <FieldContent>
                    <Input
                        id="assigner-name"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="e.g. Chromebooks, Tablets"
                        required
                        disabled={disabled}
                    />
                </FieldContent>
            </Field>

            <Field>
                <FieldLabel>Items *</FieldLabel>
                <FieldContent>
                    <Textarea
                        value={itemsText}
                        onChange={(e) => onItemsTextChange(e.target.value)}
                        placeholder="Enter items separated by commas or new lines&#10;e.g. Item 1, Item 2, Item 3&#10;or c,e,f&#10;or Item 1&#10;Item 2&#10;Item 3"
                        disabled={disabled}
                        className="text-xs md:text-sm resize-none h-32 overflow-y-auto"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        Separate items with commas or new lines. Empty lines
                        will be ignored.
                    </p>
                </FieldContent>
            </Field>

            {showDirection && onDirectionChange && (
                <Field>
                    <FieldLabel>Rotation Direction *</FieldLabel>
                    <FieldContent>
                        <Select
                            value={direction}
                            onValueChange={(value) => {
                                if (value === "front-to-back" || value === "back-to-front") {
                                    onDirectionChange(value);
                                }
                            }}
                            disabled={disabled}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="front-to-back">Front-to-back</SelectItem>
                                <SelectItem value="back-to-front">Back-to-front</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                            <strong>Back-to-front:</strong> Last item moves to the front after being last.<br />
                            <strong>Front-to-back:</strong> First item moves to the back after being first.
                        </p>
                    </FieldContent>
                </Field>
            )}

            {showBalanceGender && (
                <Field>
                    <FieldContent>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="balance-gender"
                                checked={balanceGender}
                                onCheckedChange={(checked) => onBalanceGenderChange(checked === true)}
                                disabled={disabled}
                            />
                            <FieldLabel htmlFor="balance-gender" className="cursor-pointer">
                                Balance gender
                            </FieldLabel>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            When enabled, items will be assigned to one boy and one girl, so there will be two of each item.
                        </p>
                    </FieldContent>
                </Field>
            )}

            {error && <FieldError>{error}</FieldError>}
        </div>
    );
}
