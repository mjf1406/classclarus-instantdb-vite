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
import { AssignerForm } from "./assigner-form";

interface CreateAssignerDialogProps {
    children: React.ReactNode;
    classId: string;
}

export function CreateAssignerDialog({
    children,
    classId,
}: CreateAssignerDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [itemsText, setItemsText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            const transactions = [
                db.tx.random_assigners[assignerId].create({
                    name: name.trim(),
                    items: itemsJson,
                    created: now,
                    updated: now,
                }),
                db.tx.random_assigners[assignerId].link({ class: classId }),
            ];

            db.transact(transactions);

            // Reset form and close dialog
            setName("");
            setItemsText("");
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
            setError(null);
        }
    };

    return (
        <Credenza open={open} onOpenChange={handleOpenChange}>
            <CredenzaTrigger asChild>{children}</CredenzaTrigger>
            <CredenzaContent className="flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 overflow-hidden">
                    <CredenzaHeader className="shrink-0">
                        <CredenzaTitle>Create Random Assigner</CredenzaTitle>
                        <CredenzaDescription>
                            Create a new random assigner with items that can be
                            randomly assigned to students.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="space-y-4 pr-4 pb-4">
                                <AssignerForm
                                    name={name}
                                    itemsText={itemsText}
                                    onNameChange={setName}
                                    onItemsTextChange={setItemsText}
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
