/** @format */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";

export interface SectionForm {
    name: string;
    points: number;
}

export interface AssignmentFormValues {
    name: string;
    subject: string;
    unit: string;
    sections: SectionForm[];
    totalPoints?: number;
}

interface AssignmentFormProps {
    name: string;
    subject: string;
    unit: string;
    sections: SectionForm[];
    totalPoints?: number;
    onNameChange: (name: string) => void;
    onSubjectChange: (subject: string) => void;
    onUnitChange: (unit: string) => void;
    onSectionsChange: (sections: SectionForm[]) => void;
    onTotalPointsChange: (points: number | undefined) => void;
    disabled?: boolean;
    error?: string | null;
}

export function AssignmentForm({
    name,
    subject,
    unit,
    sections,
    totalPoints,
    onNameChange,
    onSubjectChange,
    onUnitChange,
    onSectionsChange,
    onTotalPointsChange,
    disabled = false,
    error,
}: AssignmentFormProps) {
    const [localSections, setLocalSections] = useState<SectionForm[]>(sections);

    const hasSections = localSections.length > 0;
    const computedTotal = localSections.reduce(
        (sum, s) => sum + (s.points || 0),
        0
    );

    const handleAddSection = () => {
        const newSections = [...localSections, { name: "", points: 0 }];
        setLocalSections(newSections);
        onSectionsChange(newSections);
    };

    const handleRemoveSection = (idx: number) => {
        const newSections = localSections.filter((_, i) => i !== idx);
        setLocalSections(newSections);
        onSectionsChange(newSections);
    };

    const handleSectionChange = (
        idx: number,
        field: "name" | "points",
        value: string | number
    ) => {
        const newSections = [...localSections];
        newSections[idx] = {
            ...newSections[idx],
            [field]: field === "points" ? Number(value) : value,
        };
        setLocalSections(newSections);
        onSectionsChange(newSections);
    };

    const handleAddSectionsInstead = () => {
        setLocalSections([{ name: "", points: 0 }]);
        onSectionsChange([{ name: "", points: 0 }]);
        onTotalPointsChange(undefined);
    };

    return (
        <div className="space-y-4">
            <Field>
                <FieldLabel htmlFor="assignment-name">Assignment Name *</FieldLabel>
                <FieldContent>
                    <Input
                        id="assignment-name"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="e.g. Midterm Exam"
                        required
                        disabled={disabled}
                    />
                </FieldContent>
            </Field>

            <Field>
                <FieldLabel htmlFor="assignment-subject">Subject</FieldLabel>
                <FieldContent>
                    <Input
                        id="assignment-subject"
                        value={subject}
                        onChange={(e) => onSubjectChange(e.target.value)}
                        placeholder="e.g. Mathematics"
                        disabled={disabled}
                    />
                </FieldContent>
            </Field>

            <Field>
                <FieldLabel htmlFor="assignment-unit">Unit</FieldLabel>
                <FieldContent>
                    <Input
                        id="assignment-unit"
                        value={unit}
                        onChange={(e) => onUnitChange(e.target.value)}
                        placeholder="e.g. Unit 3: Algebra"
                        disabled={disabled}
                    />
                </FieldContent>
            </Field>

            {hasSections ? (
                <div className="grid gap-4">
                    <Label>Sections</Label>
                    {sections.map((section, idx) => (
                        <div key={idx} className="flex items-end gap-2">
                            <div className="grid flex-1 gap-1">
                                <Label htmlFor={`section-${idx}-name`}>
                                    Section Name
                                </Label>
                                <Input
                                    id={`section-${idx}-name`}
                                    placeholder="e.g. Problem Set"
                                    value={section.name}
                                    onChange={(e) =>
                                        handleSectionChange(idx, "name", e.target.value)
                                    }
                                    required
                                    disabled={disabled}
                                />
                            </div>

                            <div className="grid w-32 gap-1">
                                <Label htmlFor={`section-${idx}-points`}>
                                    Points
                                </Label>
                                <Input
                                    id={`section-${idx}-points`}
                                    type="number"
                                    value={section.points || ""}
                                    onChange={(e) =>
                                        handleSectionChange(
                                            idx,
                                            "points",
                                            e.target.value
                                        )
                                    }
                                    required
                                    disabled={disabled}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => handleRemoveSection(idx)}
                                disabled={disabled}
                            >
                                ×
                            </Button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddSection}
                        disabled={disabled}
                    >
                        Add Section
                    </Button>

                    <div className="flex justify-between pt-2">
                        <span className="font-medium">Total Points:</span>
                        <span className="font-semibold">{computedTotal}</span>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    <Field>
                        <FieldLabel htmlFor="assignment-total-points">
                            Total Points
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="assignment-total-points"
                                type="number"
                                placeholder="e.g. 100"
                                value={totalPoints || ""}
                                onChange={(e) =>
                                    onTotalPointsChange(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : undefined
                                    )
                                }
                                required
                                disabled={disabled}
                            />
                        </FieldContent>
                    </Field>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddSectionsInstead}
                        disabled={disabled}
                    >
                        Add Sections Instead
                    </Button>
                </div>
            )}

            {error && <FieldError>{error}</FieldError>}
        </div>
    );
}
