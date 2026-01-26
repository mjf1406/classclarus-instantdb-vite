/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Dice6 } from "lucide-react";
import { RollDisplayModal } from "./roll-display-modal";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type EventEntity = InstaQLEntity<
    AppSchema,
    "random_events",
    { rolls?: {} }
>;
type RollEntity = InstaQLEntity<AppSchema, "random_event_rolls">;

interface RollEventButtonProps {
    events: EventEntity[];
    classId: string;
    canManage: boolean;
}

export function RollEventButton({
    events,
    classId,
    canManage,
}: RollEventButtonProps) {
    const [isRolling, setIsRolling] = useState(false);
    const [rolledEvent, setRolledEvent] = useState<EventEntity | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleRoll = async () => {
        if (events.length === 0) {
            return;
        }

        setIsRolling(true);

        try {
            // Get all events with their rolls
            const eventsWithRolls = events.map((event) => ({
                event,
                rollCount: event.rolls?.length || 0,
            }));

            // Filter to events that haven't been rolled yet
            const unrolledEvents = eventsWithRolls.filter(
                (item) => item.rollCount === 0
            );

            // Prefer unrolled events, but if all have been rolled, pick from all events
            const eventsToChooseFrom =
                unrolledEvents.length > 0 ? unrolledEvents : eventsWithRolls;

            // Randomly select one event
            const randomIndex = Math.floor(
                Math.random() * eventsToChooseFrom.length
            );
            const selectedEvent = eventsToChooseFrom[randomIndex].event;

            // Create a roll record for the selected event
            const rollId = id();
            const now = new Date();
            db.transact([
                db.tx.random_event_rolls[rollId].create({
                    rolledAt: now,
                }),
                db.tx.random_event_rolls[rollId].link({
                    event: selectedEvent.id,
                }),
            ]);

            // Show the modal with the selected event
            setRolledEvent(selectedEvent);
            setShowModal(true);
        } catch (err) {
            console.error("Failed to roll event:", err);
        } finally {
            setIsRolling(false);
        }
    };

    return (
        <>
            <Button
                onClick={handleRoll}
                disabled={isRolling || events.length === 0 || !canManage}
                size="lg"
                className="gap-2"
            >
                <Dice6 className="size-5" />
                {isRolling ? "Rolling..." : "Roll Event"}
            </Button>
            <RollDisplayModal
                open={showModal}
                onOpenChange={setShowModal}
                event={rolledEvent}
            />
        </>
    );
}
