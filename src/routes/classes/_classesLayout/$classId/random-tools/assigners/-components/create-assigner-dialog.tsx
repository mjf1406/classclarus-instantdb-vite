/** @format */

import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssignerForm, type AssignerType } from "./assigner-form";

interface CreateAssignerDialogProps {
    children: React.ReactNode;
    assignerType: AssignerType;
    classId: string;
}

const ASSIGNER_TYPE_CONFIG: Record<
    AssignerType,
    { title: string; description: string; entityName: string }
> = {
    random: {
        title: "Create Random Assigner",
        description:
            "Create a new random assigner with items that can be randomly assigned to students.",
        entityName: "random_assigners",
    },
    rotating: {
        title: "Create Rotating Assigner",
        description:
            "Create a new rotating assigner with items that can be assigned to students in a predictable sequence.",
        entityName: "rotating_assigners",
    },
    equitable: {
        title: "Create Equitable Assigner",
        description:
            "Create a new equitable assigner with items that can be assigned to students with balanced experience.",
        entityName: "equitable_assigners",
    },
};

export function CreateAssignerDialog({
    children,
    assignerType,
    classId,
}: CreateAssignerDialogProps) {
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
            const assignerId = id();
            const now = new Date();

            // Store items as JSON string
            const itemsJson = JSON.stringify(validItems);

            // Create entity based on type
            if (assignerType === "random") {
                const createTx = db.tx.random_assigners[assignerId].create({
                    name: name.trim(),
                    items: itemsJson,
                    created: now,
                    updated: now,
                });
                const linkTx = db.tx.random_assigners[assignerId].link({
                    class: classId,
                });
                db.transact([createTx, linkTx]);
            } else if (assignerType === "rotating") {
                const createTx = db.tx.rotating_assigners[assignerId].create({
                    name: name.trim(),
                    items: itemsJson,
                    balanceGender,
                    created: now,
                    updated: now,
                });
                const linkTx = db.tx.rotating_assigners[assignerId].link({
                    class: classId,
                });
                db.transact([createTx, linkTx]);
            } else {
                const createTx = db.tx.equitable_assigners[assignerId].create({
                    name: name.trim(),
                    items: itemsJson,
                    balanceGender,
                    created: now,
                    updated: now,
                });
                const linkTx = db.tx.equitable_assigners[assignerId].link({
                    class: classId,
                });
                db.transact([createTx, linkTx]);
            }

            // Reset form and close dialog
            setName("");
            setItemsText("");
            setBalanceGender(false);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create assigner"
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

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col h-full min-h-0 overflow-hidden"
                >
                    <CredenzaHeader className="shrink-0">
                        <CredenzaTitle>{config.title}</CredenzaTitle>
                        <CredenzaDescription>{config.description}</CredenzaDescription>
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
                            {isSubmitting ? "Creating..." : "Create Assigner"}
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
            </CredenzaContent>
        </Credenza>
    );
}
