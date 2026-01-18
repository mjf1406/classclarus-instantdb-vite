/** @format */

import { db } from "@/lib/db/db";
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
    FieldLabel,
} from "@/components/ui/field";

const UNCATEGORIZED_VALUE = "__uncategorized__";

interface FolderSelectProps {
    classId: string;
    value: string | null;
    onChange: (id: string | null) => void;
    disabled?: boolean;
    placeholder?: string;
}

type FoldersQueryResult = {
    folders: Array<{ id: string; name: string }>;
};

export function FolderSelect({
    classId,
    value,
    onChange,
    disabled = false,
    placeholder = "Select folder",
}: FolderSelectProps) {
    const { data, isLoading } = db.useQuery(
        classId
            ? {
                  folders: {
                      $: { where: { "class.id": classId } },
                      class: {},
                  },
              }
            : null
    );

    const typedData = (data as FoldersQueryResult | undefined) ?? null;
    const folders = typedData?.folders ?? [];

    const selectValue = value ?? UNCATEGORIZED_VALUE;

    const handleValueChange = (v: string) => {
        onChange(v === UNCATEGORIZED_VALUE ? null : v);
    };

    return (
        <Field>
            <FieldLabel>Folder</FieldLabel>
            <FieldContent>
                <Select
                    value={selectValue}
                    onValueChange={handleValueChange}
                    disabled={disabled || isLoading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={UNCATEGORIZED_VALUE}>
                            Uncategorized
                        </SelectItem>
                        {folders.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                                {f.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FieldContent>
        </Field>
    );
}
