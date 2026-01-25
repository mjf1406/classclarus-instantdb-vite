/** @format */

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssignerForm, type AssignerType } from "./assigner-form";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type AssignerEntity =
    | InstaQLEntity<AppSchema, "random_assigners">
    | InstaQLEntity<AppSchema, "rotating_assigners">
    | InstaQLEntity<AppSchema, "equitable_assigners">;

interface EditAssignerDialogProps {
    children?: React.ReactNode;
    assignerType: AssignerType;
    assigner: AssignerEntity;
    asDropdownItem?: boolean;
}

const ASSIGNER_TYPE_CONFIG: Record<
    AssignerType,
    { title: string; entityName: string }
> = {
    random: {
        title: "Edit Random Assigner",
        entityName: "random_assigners",
    },
    rotating: {
        title: "Edit Rotating Assigner",
        entityName: "rotating_assigners",
    },
    equitable: {
        title: "Edit Equitable Assigner",
        entityName: "equitable_assigners",
    },
};

export function EditAssignerDialog({
    children,
    assignerType,
    assigner,
    asDropdownItem = false,
}: EditAssignerDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [itemsText, setItemsText] = useState("");
    const [balanceGender, setBalanceGender] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const config = ASSIGNER_TYPE_CONFIG[assignerType];

    // Parse text input to array - handles both "c,e,f" and "c, d, e, f" formats
    const parseItemsText = (text: string): string[] => {
        if (!text || !text.trim()) return [];
        return text
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    };

    useEffect(() => {
        if (open && assigner) {
            setName(assigner.name || "");
            if (assignerType !== "random" && "balanceGender" in assigner) {
                setBalanceGender(assigner.balanceGender ?? false);
            }
            // Parse JSON string to array and convert to text
            try {
                const parsedItems =
                    assigner.items && assigner.items.trim()
                        ? JSON.parse(assigner.items)
                        : [];
                const itemsArray = Array.isArray(parsedItems) ? parsedItems : [];
                // Initialize itemsText from items
                setItemsText(itemsArray.filter((item) => item.trim()).join("\n"));
            } catch (err) {
                // If parsing fails, treat as empty
                setItemsText("");
            }
        }
    }, [open, assigner, assignerType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        // Parse items from text input
        const validItems = parseItemsText(itemsText);

        if (validItems.length === 0) {
            setError("At least one item is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();

            // Store items as JSON string
            const itemsJson = JSON.stringify(validItems);

            const updateData: {
                name: string;
                items: string;
                updated: Date;
                balanceGender?: boolean;
            } = {
                name: name.trim(),
                items: itemsJson,
                updated: now,
            };

            if (assignerType !== "random") {
                updateData.balanceGender = balanceGender;
            }

            db.transact([
                db.tx[config.entityName as keyof typeof db.tx][assigner.id].update(
                    updateData
                ),
            ]);

            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update assigner"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setName("");
            setItemsText("");
            setBalanceGender(false);
            setError(null);
        }
    };

    const formContent = (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col h-full min-h-0 overflow-hidden"
        >
            <CredenzaHeader className="shrink-0">
                <CredenzaTitle>{config.title}</CredenzaTitle>
                <CredenzaDescription>
                    Update the assigner details and items.
                </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4 pb-4">
                        <AssignerForm
                            assignerType={assignerType}
                            name={name}
                            itemsText={itemsText}
                            balanceGender={balanceGender}
                            onNameChange={setName}
                            onItemsTextChange={setItemsText}
                            onBalanceGenderChange={setBalanceGender}
                            disabled={isSubmitting}
                            error={error}
                        />
                    </div>
                </ScrollArea>
            </CredenzaBody>
            <CredenzaFooter className="shrink-0">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
            </CredenzaFooter>
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
                    className="flex items-center gap-2"
                >
                    <Pencil className="size-4" />
                    {children || "Edit"}
                </DropdownMenuItem>
                <Credenza open={open} onOpenChange={handleOpenChange}>
                    <CredenzaContent className="flex flex-col max-h-[90vh]">
                        {formContent}
                    </CredenzaContent>
                </Credenza>
            </>
        );
    }

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>
                <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {children}
                </div>
            </CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                {formContent}
            </CredenzaContent>
        </Credenza>
    );
}
