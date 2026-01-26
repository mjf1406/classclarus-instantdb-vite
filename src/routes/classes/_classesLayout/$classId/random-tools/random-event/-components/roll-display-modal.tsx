/** @format */

import { useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type EventEntity = InstaQLEntity<AppSchema, "random_events">;

interface RollDisplayModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: EventEntity | null;
}

export function RollDisplayModal({
    open,
    onOpenChange,
    event,
}: RollDisplayModalProps) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (open && event?.audioUrl && audioRef.current) {
            // Auto-play audio when modal opens
            audioRef.current.play().catch((err) => {
                console.error("Failed to play audio:", err);
            });
        }
    }, [open, event?.audioUrl]);

    useEffect(() => {
        // Stop audio when modal closes
        if (!open && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [open]);

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl md:text-3xl">
                        {event.name}
                    </DialogTitle>
                    {event.description && (
                        <DialogDescription className="text-base">
                            {event.description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {event.imageUrl && (
                        <div className="relative w-full rounded-lg overflow-hidden border bg-muted">
                            <img
                                src={event.imageUrl}
                                alt={event.name}
                                className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                            />
                        </div>
                    )}
                    {event.audioUrl && (
                        <div className="flex items-center justify-center p-4 border rounded-lg bg-muted">
                            <audio
                                ref={audioRef}
                                src={event.audioUrl}
                                controls
                                className="w-full max-w-md"
                                autoPlay
                            >
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                </div>
                <div className="flex justify-end mt-6">
                    <Button onClick={() => onOpenChange(false)}>
                        <X className="size-4 mr-2" />
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
