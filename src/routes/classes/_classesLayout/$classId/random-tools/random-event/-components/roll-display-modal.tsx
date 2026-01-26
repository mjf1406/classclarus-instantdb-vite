/** @format */

import { useEffect, useRef, useState } from "react";
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
    allEvents: EventEntity[];
    selectedEvent: EventEntity | null;
}

export function RollDisplayModal({
    open,
    onOpenChange,
    allEvents,
    selectedEvent,
}: RollDisplayModalProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const startTimeRef = useRef<number | null>(null);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Start animation when modal opens
    useEffect(() => {
        if (open && allEvents.length > 0 && selectedEvent) {
            setIsAnimating(true);
            setCurrentEventIndex(0);
            startTimeRef.current = Date.now();
            
            const animate = () => {
                if (!startTimeRef.current) return;
                
                const elapsed = Date.now() - startTimeRef.current;
                const progress = elapsed / 3000; // 3 seconds total
                
                if (progress >= 1) {
                    // Animation complete - show selected event
                    setIsAnimating(false);
                    // Find index of selected event to end on it
                    const selectedIndex = allEvents.findIndex(
                        (e) => e.id === selectedEvent.id
                    );
                    if (selectedIndex !== -1) {
                        setCurrentEventIndex(selectedIndex);
                    }
                    return;
                }
                
                // Easing: fast at start, slow at end (ease-out cubic)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const baseInterval = 50;
                const maxInterval = 500;
                const currentInterval = baseInterval + easeOut * (maxInterval - baseInterval);
                
                // Cycle to next event
                setCurrentEventIndex((prev) => (prev + 1) % allEvents.length);
                
                animationTimeoutRef.current = setTimeout(animate, currentInterval);
            };
            
            animate();
        } else if (!open) {
            // Reset animation state when modal closes
            setIsAnimating(false);
            setCurrentEventIndex(0);
            startTimeRef.current = null;
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        }
        
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [open, allEvents, selectedEvent]);

    // Play audio only when animation completes
    useEffect(() => {
        if (open && !isAnimating && selectedEvent?.audioUrl && audioRef.current) {
            // Auto-play audio when animation completes
            audioRef.current.play().catch((err) => {
                console.error("Failed to play audio:", err);
            });
        }
    }, [open, isAnimating, selectedEvent?.audioUrl]);

    useEffect(() => {
        // Stop audio when modal closes
        if (!open && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [open]);

    // Determine which event to display
    const displayEvent = isAnimating
        ? allEvents[currentEventIndex]
        : selectedEvent;

    if (!displayEvent) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle
                        className={`text-2xl md:text-3xl transition-all duration-200 ${
                            isAnimating ? "opacity-70" : "opacity-100"
                        }`}
                    >
                        {displayEvent.name}
                    </DialogTitle>
                    {displayEvent.description && (
                        <DialogDescription
                            className={`text-base transition-all duration-200 ${
                                isAnimating ? "opacity-70" : "opacity-100"
                            }`}
                        >
                            {displayEvent.description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {displayEvent.imageUrl && (
                        <div
                            className={`relative w-full rounded-lg overflow-hidden border bg-muted transition-all duration-200 ${
                                isAnimating
                                    ? "opacity-70 scale-95"
                                    : "opacity-100 scale-100"
                            }`}
                        >
                            <img
                                src={displayEvent.imageUrl}
                                alt={displayEvent.name}
                                className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                            />
                        </div>
                    )}
                    {!isAnimating && selectedEvent?.audioUrl && (
                        <div className="flex items-center justify-center p-4 border rounded-lg bg-muted">
                            <audio
                                ref={audioRef}
                                src={selectedEvent.audioUrl}
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
