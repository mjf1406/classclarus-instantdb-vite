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
import { EventForm } from "./event-form";

interface CreateEventDialogProps {
    children: React.ReactNode;
    classId: string;
}

export function CreateEventDialog({
    children,
    classId,
}: CreateEventDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const eventId = id();
            const now = new Date();

            const transactions = [
                db.tx.random_events[eventId].create({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    imageUrl: imageUrl || undefined,
                    audioUrl: audioUrl || undefined,
                    created: now,
                    updated: now,
                }),
                db.tx.random_events[eventId].link({ class: classId }),
            ];

            db.transact(transactions);

            // Reset form and close dialog
            setName("");
            setDescription("");
            setImageUrl(undefined);
            setAudioUrl(undefined);
            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create event"
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
            setImageUrl(undefined);
            setAudioUrl(undefined);
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
                        <CredenzaTitle>Create Random Event</CredenzaTitle>
                        <CredenzaDescription>
                            Create a new random event with optional image and
                            audio.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="space-y-4 pr-4 pb-4">
                                <EventForm
                                    name={name}
                                    description={description}
                                    imageUrl={imageUrl}
                                    audioUrl={audioUrl}
                                    onNameChange={setName}
                                    onDescriptionChange={setDescription}
                                    onImageUrlChange={setImageUrl}
                                    onAudioUrlChange={setAudioUrl}
                                    disabled={isSubmitting}
                                    error={error}
                                    classId={classId}
                                />
                            </div>
                        </ScrollArea>
                    </CredenzaBody>
                    <CredenzaFooter className="shrink-0">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Event"}
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
