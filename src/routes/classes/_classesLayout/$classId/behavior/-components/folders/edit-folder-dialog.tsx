/** @format */

import { useState, useEffect } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { db } from "@/lib/db/db";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FontAwesomeIconPickerLazy } from "@/components/icons/FontAwesomeIconPickerLazy";
import { resolveIconId } from "@/lib/fontawesome-icon-catalog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface EditFolderDialogProps {
    children?: React.ReactNode;
    folder: InstaQLEntity<AppSchema, "folders", { class?: {} }>;
    asDropdownItem?: boolean;
}

export function EditFolderDialog({
    children,
    folder,
    asDropdownItem = false,
}: EditFolderDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [iconDef, setIconDef] = useState<IconDefinition | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Purchase limit fields
    const [purchaseLimitEnabled, setPurchaseLimitEnabled] = useState(false);
    const [purchaseLimitCount, setPurchaseLimitCount] = useState<string>("1");
    const [purchaseLimitType, setPurchaseLimitType] = useState<"recurring" | "dateRange">("recurring");
    const [purchaseLimitPeriod, setPurchaseLimitPeriod] = useState<"day" | "week" | "month">("week");
    const [purchaseLimitPeriodMultiplier, setPurchaseLimitPeriodMultiplier] = useState<string>("1");
    const [purchaseLimitStartDate, setPurchaseLimitStartDate] = useState<string>("");
    const [purchaseLimitEndDate, setPurchaseLimitEndDate] = useState<string>("");

    useEffect(() => {
        if (open && folder) {
            setName(folder.name || "");
            setDescription(folder.description || "");
            if (folder.icon) {
                resolveIconId(folder.icon).then(setIconDef);
            } else {
                setIconDef(null);
            }
            // Load purchase limit fields
            setPurchaseLimitEnabled(folder.purchaseLimitEnabled ?? false);
            setPurchaseLimitCount(
                folder.purchaseLimitCount !== undefined && folder.purchaseLimitCount !== null
                    ? String(folder.purchaseLimitCount)
                    : "1"
            );
            setPurchaseLimitType(
                (folder.purchaseLimitType as "recurring" | "dateRange") ?? "recurring"
            );
            setPurchaseLimitPeriod(
                (folder.purchaseLimitPeriod as "day" | "week" | "month") ?? "week"
            );
            setPurchaseLimitPeriodMultiplier(
                folder.purchaseLimitPeriodMultiplier !== undefined && folder.purchaseLimitPeriodMultiplier !== null
                    ? String(folder.purchaseLimitPeriodMultiplier)
                    : "1"
            );
            if (folder.purchaseLimitStartDate) {
                const startDate = new Date(folder.purchaseLimitStartDate);
                setPurchaseLimitStartDate(startDate.toISOString().split("T")[0]);
            } else {
                setPurchaseLimitStartDate("");
            }
            if (folder.purchaseLimitEndDate) {
                const endDate = new Date(folder.purchaseLimitEndDate);
                setPurchaseLimitEndDate(endDate.toISOString().split("T")[0]);
            } else {
                setPurchaseLimitEndDate("");
            }
        }
    }, [open, folder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        // Validate purchase limit if enabled
        if (purchaseLimitEnabled) {
            const limitCount = Number(purchaseLimitCount);
            if (Number.isNaN(limitCount) || limitCount <= 0) {
                setError("Purchase limit count must be a positive number");
                return;
            }

            if (purchaseLimitType === "recurring") {
                const multiplier = Number(purchaseLimitPeriodMultiplier);
                if (Number.isNaN(multiplier) || multiplier <= 0) {
                    setError("Period multiplier must be a positive number");
                    return;
                }
            } else if (purchaseLimitType === "dateRange") {
                if (!purchaseLimitStartDate || !purchaseLimitEndDate) {
                    setError("Start date and end date are required for date range limits");
                    return;
                }
                const start = new Date(purchaseLimitStartDate);
                const end = new Date(purchaseLimitEndDate);
                if (start >= end) {
                    setError("End date must be after start date");
                    return;
                }
            }
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            db.transact([
                db.tx.folders[folder.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    updated: now,
                    purchaseLimitEnabled: purchaseLimitEnabled || undefined,
                    purchaseLimitCount: purchaseLimitEnabled ? Number(purchaseLimitCount) : undefined,
                    purchaseLimitType: purchaseLimitEnabled ? purchaseLimitType : undefined,
                    purchaseLimitPeriod: purchaseLimitEnabled && purchaseLimitType === "recurring" ? purchaseLimitPeriod : undefined,
                    purchaseLimitPeriodMultiplier: purchaseLimitEnabled && purchaseLimitType === "recurring" ? Number(purchaseLimitPeriodMultiplier) : undefined,
                    purchaseLimitStartDate: purchaseLimitEnabled && purchaseLimitType === "dateRange" ? new Date(purchaseLimitStartDate) : undefined,
                    purchaseLimitEndDate: purchaseLimitEnabled && purchaseLimitType === "dateRange" ? new Date(purchaseLimitEndDate) : undefined,
                }),
            ]);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update folder"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setName("");
            setDescription("");
            setIconDef(null);
            setError(null);
            setPurchaseLimitEnabled(false);
            setPurchaseLimitCount("1");
            setPurchaseLimitType("recurring");
            setPurchaseLimitPeriod("week");
            setPurchaseLimitPeriodMultiplier("1");
            setPurchaseLimitStartDate("");
            setPurchaseLimitEndDate("");
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Edit Folder</DialogTitle>
                <DialogDescription>
                    Update folder name and description.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Field>
                    <FieldLabel htmlFor="edit-folder-name">Name *</FieldLabel>
                    <FieldContent>
                        <Input
                            id="edit-folder-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Participation"
                            required
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="edit-folder-description">
                        Description
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id="edit-folder-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>Icon</FieldLabel>
                    <FieldContent>
                        <div className="flex items-center gap-2">
                            <FontAwesomeIconPickerLazy
                                value={iconDef}
                                onChange={(def) => setIconDef(def)}
                                placeholder="Pick an icon (optional)"
                                disabled={isSubmitting}
                            />
                            {iconDef && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIconDef(null)}
                                    disabled={isSubmitting}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldContent>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="edit-folder-purchase-limit-enabled"
                                checked={purchaseLimitEnabled}
                                onCheckedChange={(checked) => setPurchaseLimitEnabled(checked === true)}
                                disabled={isSubmitting}
                            />
                            <FieldLabel htmlFor="edit-folder-purchase-limit-enabled" className="cursor-pointer">
                                Enable purchase limit (applies to all items in folder)
                            </FieldLabel>
                        </div>
                    </FieldContent>
                </Field>

                {purchaseLimitEnabled && (
                    <>
                        <Field>
                            <FieldLabel htmlFor="edit-folder-purchase-limit-count">
                                Maximum purchases *
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="edit-folder-purchase-limit-count"
                                    type="number"
                                    min={1}
                                    value={purchaseLimitCount}
                                    onChange={(e) => setPurchaseLimitCount(e.target.value)}
                                    placeholder="e.g. 1"
                                    disabled={isSubmitting}
                                    required
                                />
                            </FieldContent>
                            <p className="text-xs text-muted-foreground mt-1">
                                Maximum number of items from this folder that can be purchased.
                            </p>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="edit-folder-purchase-limit-type">
                                Limit type *
                            </FieldLabel>
                            <FieldContent>
                                <Select
                                    value={purchaseLimitType}
                                    onValueChange={(value) => setPurchaseLimitType(value as "recurring" | "dateRange")}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger id="edit-folder-purchase-limit-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recurring">Recurring Period</SelectItem>
                                        <SelectItem value="dateRange">Date Range Cycle</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                            <p className="text-xs text-muted-foreground mt-1">
                                {purchaseLimitType === "recurring"
                                    ? "Limit resets every X days/weeks/months."
                                    : "Limit resets after the end date, then repeats."}
                            </p>
                        </Field>

                        {purchaseLimitType === "recurring" && (
                            <>
                                <Field>
                                    <FieldLabel htmlFor="edit-folder-purchase-limit-period">
                                        Period *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Select
                                            value={purchaseLimitPeriod}
                                            onValueChange={(value) => setPurchaseLimitPeriod(value as "day" | "week" | "month")}
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger id="edit-folder-purchase-limit-period">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="day">Day</SelectItem>
                                                <SelectItem value="week">Week</SelectItem>
                                                <SelectItem value="month">Month</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="edit-folder-purchase-limit-multiplier">
                                        Every X {purchaseLimitPeriod}s *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-folder-purchase-limit-multiplier"
                                            type="number"
                                            min={1}
                                            value={purchaseLimitPeriodMultiplier}
                                            onChange={(e) => setPurchaseLimitPeriodMultiplier(e.target.value)}
                                            placeholder="e.g. 1"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </FieldContent>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Example: "1" = every week, "2" = every 2 weeks
                                    </p>
                                </Field>
                            </>
                        )}

                        {purchaseLimitType === "dateRange" && (
                            <>
                                <Field>
                                    <FieldLabel htmlFor="edit-folder-purchase-limit-start-date">
                                        Start date *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-folder-purchase-limit-start-date"
                                            type="date"
                                            value={purchaseLimitStartDate}
                                            onChange={(e) => setPurchaseLimitStartDate(e.target.value)}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="edit-folder-purchase-limit-end-date">
                                        End date *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-folder-purchase-limit-end-date"
                                            type="date"
                                            value={purchaseLimitEndDate}
                                            onChange={(e) => setPurchaseLimitEndDate(e.target.value)}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </FieldContent>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        After the end date, the cycle resets and continues.
                                    </p>
                                </Field>
                            </>
                        )}
                    </>
                )}

                {error && <FieldError>{error}</FieldError>}
            </div>
            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </DialogFooter>
        </form>
    );

    if (asDropdownItem) {
        return (
            <>
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    {children || "Edit"}
                </DropdownMenuItem>
                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogContent>{formContent}</DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                {children}
            </DialogTrigger>
            <DialogContent>{formContent}</DialogContent>
        </Dialog>
    );
}
