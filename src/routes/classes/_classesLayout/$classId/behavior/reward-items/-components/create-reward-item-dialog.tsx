/** @format */

import { useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import {
    Credenza,
    CredenzaTrigger,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
} from "@/components/ui/credenza";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontAwesomeIconPickerLazy } from "@/components/icons/FontAwesomeIconPickerLazy";
import { FolderSelect } from "../../-components/folders/folder-select";

interface CreateRewardItemDialogProps {
    children: React.ReactNode;
    classId: string;
    initialFolderId?: string | null;
}

export function CreateRewardItemDialog({
    children,
    classId,
    initialFolderId,
}: CreateRewardItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [costStr, setCostStr] = useState("");
    const [folderId, setFolderId] = useState<string | null>(null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        const cost = costStr.trim() === "" ? undefined : Number(costStr);
        if (cost === undefined || Number.isNaN(cost) || cost <= 0) {
            setError("Cost must be a positive number");
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
            const rewardItemId = id();
            const now = new Date();

            const transactions = [
                db.tx.reward_items[rewardItemId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    icon: iconDef ? `${iconDef.prefix}:${iconDef.iconName}` : undefined,
                    cost,
                    created: now,
                    updated: now,
                    purchaseLimitEnabled: purchaseLimitEnabled || undefined,
                    purchaseLimitCount: purchaseLimitEnabled ? Number(purchaseLimitCount) : undefined,
                    purchaseLimitType: purchaseLimitEnabled ? purchaseLimitType : undefined,
                    purchaseLimitPeriod: purchaseLimitEnabled && purchaseLimitType === "recurring" ? purchaseLimitPeriod : undefined,
                    purchaseLimitPeriodMultiplier: purchaseLimitEnabled && purchaseLimitType === "recurring" ? Number(purchaseLimitPeriodMultiplier) : undefined,
                    purchaseLimitStartDate: purchaseLimitEnabled && purchaseLimitType === "dateRange" ? new Date(purchaseLimitStartDate) : undefined,
                    purchaseLimitEndDate: purchaseLimitEnabled && purchaseLimitType === "dateRange" ? new Date(purchaseLimitEndDate) : undefined,
                }),
                db.tx.reward_items[rewardItemId].link({ class: classId }),
            ];
            if (folderId) {
                transactions.push(
                    db.tx.reward_items[rewardItemId].link({ folder: folderId })
                );
            }
            db.transact(transactions);

            setName("");
            setDescription("");
            setCostStr("");
            setFolderId(null);
            setPurchaseLimitEnabled(false);
            setPurchaseLimitCount("1");
            setPurchaseLimitType("recurring");
            setPurchaseLimitPeriod("week");
            setPurchaseLimitPeriodMultiplier("1");
            setPurchaseLimitStartDate("");
            setPurchaseLimitEndDate("");
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create reward item"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setFolderId(initialFolderId ?? null);
        } else {
            setName("");
            setDescription("");
            setCostStr("");
            setFolderId(null);
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

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <CredenzaHeader>
                        <CredenzaTitle>Create Reward Item</CredenzaTitle>
                        <CredenzaDescription>
                            Add a reward that students can redeem with points.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody className="flex-1 overflow-hidden min-h-0">
                        <ScrollArea className="h-full">
                            <div className="space-y-4 pr-4 pb-4">
                        <Field>
                            <FieldLabel htmlFor="reward-name">Name *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="reward-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Extra recess"
                                    required
                                    disabled={isSubmitting}
                                />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="reward-description">
                                Description
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="reward-description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
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

                        <FolderSelect
                            classId={classId}
                            value={folderId}
                            onChange={setFolderId}
                            disabled={isSubmitting}
                            placeholder="Uncategorized"
                        />

                        <Field>
                            <FieldLabel htmlFor="reward-cost">
                                Cost (points) *</FieldLabel>
                            <FieldContent>
                                <Input
                                    id="reward-cost"
                                    type="number"
                                    min={1}
                                    value={costStr}
                                    onChange={(e) => setCostStr(e.target.value)}
                                    placeholder="e.g. 10"
                                    disabled={isSubmitting}
                                    required
                                />
                            </FieldContent>
                            <p className="text-xs text-muted-foreground mt-1">
                                Points required to redeem this reward.
                            </p>
                        </Field>

                        <Field>
                            <FieldContent>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="purchase-limit-enabled"
                                        checked={purchaseLimitEnabled}
                                        onCheckedChange={(checked) => setPurchaseLimitEnabled(checked === true)}
                                        disabled={isSubmitting}
                                    />
                                    <FieldLabel htmlFor="purchase-limit-enabled" className="cursor-pointer">
                                        Enable purchase limit
                                    </FieldLabel>
                                </div>
                            </FieldContent>
                        </Field>

                        {purchaseLimitEnabled && (
                            <>
                                <Field>
                                    <FieldLabel htmlFor="purchase-limit-count">
                                        Maximum purchases *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="purchase-limit-count"
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
                                        Maximum number of times this item can be purchased.
                                    </p>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="purchase-limit-type">
                                        Limit type *
                                    </FieldLabel>
                                    <FieldContent>
                                        <Select
                                            value={purchaseLimitType}
                                            onValueChange={(value) => setPurchaseLimitType(value as "recurring" | "dateRange")}
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger id="purchase-limit-type">
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
                                            <FieldLabel htmlFor="purchase-limit-period">
                                                Period *
                                            </FieldLabel>
                                            <FieldContent>
                                                <Select
                                                    value={purchaseLimitPeriod}
                                                    onValueChange={(value) => setPurchaseLimitPeriod(value as "day" | "week" | "month")}
                                                    disabled={isSubmitting}
                                                >
                                                    <SelectTrigger id="purchase-limit-period">
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
                                            <FieldLabel htmlFor="purchase-limit-multiplier">
                                                Every X {purchaseLimitPeriod}s *
                                            </FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    id="purchase-limit-multiplier"
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
                                            <FieldLabel htmlFor="purchase-limit-start-date">
                                                Start date *
                                            </FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    id="purchase-limit-start-date"
                                                    type="date"
                                                    value={purchaseLimitStartDate}
                                                    onChange={(e) => setPurchaseLimitStartDate(e.target.value)}
                                                    disabled={isSubmitting}
                                                    required
                                                />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel htmlFor="purchase-limit-end-date">
                                                End date *
                                            </FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    id="purchase-limit-end-date"
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
                        </ScrollArea>
                    </CredenzaBody>
                    <CredenzaFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Reward Item"}
                        </Button>
                    </CredenzaFooter>
                </form>
            </CredenzaContent>
        </Credenza>
    );
}
