/** @format */

import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AssignerFormProps {
    name: string;
    itemsText: string;
    onNameChange: (name: string) => void;
    onItemsTextChange: (text: string) => void;
    disabled?: boolean;
    error?: string | null;
}

export function AssignerForm({
    name,
    itemsText,
    onNameChange,
    onItemsTextChange,
    disabled = false,
    error,
}: AssignerFormProps) {
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

            {error && <FieldError>{error}</FieldError>}
        </div>
    );
}
