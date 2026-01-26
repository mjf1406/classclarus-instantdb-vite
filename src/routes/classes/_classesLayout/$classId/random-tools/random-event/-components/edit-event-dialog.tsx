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
import { EventForm } from "./event-form";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type EventEntity = InstaQLEntity<AppSchema, "random_events">;

interface EditEventDialogProps {
    children?: React.ReactNode;
    event: EventEntity;
    classId: string;
    asDropdownItem?: boolean;
}

export function EditEventDialog({
    children,
    event,
    classId,
    asDropdownItem = false,
}: EditEventDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && event) {
            setName(event.name || "");
            setDescription(event.description || "");
            setImageUrl(event.imageUrl || undefined);
            setAudioUrl(event.audioUrl || undefined);
        }
    }, [open, event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();

            db.transact([
                db.tx.random_events[event.id].update({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    imageUrl: imageUrl || undefined,
                    audioUrl: audioUrl || undefined,
                    updated: now,
                }),
            ]);

            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update event"
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

    const formContent = (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col h-full min-h-0 overflow-hidden"
        >
            <CredenzaHeader className="shrink-0">
                <CredenzaTitle>Edit Random Event</CredenzaTitle>
                <CredenzaDescription>
                    Update the event details, image, and audio.
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
