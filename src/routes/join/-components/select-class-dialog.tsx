/** @format */

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ClassOption {
    id: string;
    name: string;
    organizationName: string | null;
}

interface SelectClassDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentName: string;
    classes: ClassOption[];
    onSelect: (classIds: string[]) => Promise<void>;
    isSubmitting?: boolean;
}

export function SelectClassDialog({
    open,
    onOpenChange,
    studentName,
    classes,
    onSelect,
    isSubmitting = false,
}: SelectClassDialogProps) {
    const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(
        new Set()
    );

    const handleToggleClass = (classId: string) => {
        setSelectedClassIds((prev) => {
            const next = new Set(prev);
            if (next.has(classId)) {
                next.delete(classId);
            } else {
                next.add(classId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedClassIds.size === classes.length) {
            setSelectedClassIds(new Set());
        } else {
            setSelectedClassIds(new Set(classes.map((c) => c.id)));
        }
    };

    const handleSubmit = async () => {
        if (selectedClassIds.size === 0) {
            return;
        }
        await onSelect(Array.from(selectedClassIds));
    };

    const handleCancel = () => {
        setSelectedClassIds(new Set());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Class(es) to Join</DialogTitle>
                    <DialogDescription>
                        {studentName} is enrolled in multiple classes. Please
                        select which class(es) you would like to join as their
                        guardian.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            Select Classes
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={isSubmitting}
                        >
                            {selectedClassIds.size === classes.length
                                ? "Deselect All"
                                : "Select All"}
                        </Button>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {classes.map((classOption) => (
                            <div
                                key={classOption.id}
                                className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                            >
                                <Checkbox
                                    id={classOption.id}
                                    checked={selectedClassIds.has(
                                        classOption.id
                                    )}
                                    onCheckedChange={() =>
                                        handleToggleClass(classOption.id)
                                    }
                                    disabled={isSubmitting}
                                    className="mt-1"
                                />
                                <div className="flex-1 space-y-1">
                                    <Label
                                        htmlFor={classOption.id}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        {classOption.name}
                                    </Label>
                                    {classOption.organizationName && (
                                        <p className="text-xs text-muted-foreground">
                                            {classOption.organizationName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            selectedClassIds.size === 0 || isSubmitting
                        }
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            `Join ${selectedClassIds.size} Class${selectedClassIds.size !== 1 ? "es" : ""}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
