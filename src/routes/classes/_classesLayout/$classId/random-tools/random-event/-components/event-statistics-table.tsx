/** @format */

import { useState } from "react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronDown, BarChart3 } from "lucide-react";
import { RollStatisticsModal } from "./roll-statistics-modal";
import { Button } from "@/components/ui/button";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type EventEntity = InstaQLEntity<
    AppSchema,
    "random_events",
    { rolls?: {} }
>;

interface EventStatisticsTableProps {
    events: EventEntity[];
}

export function EventStatisticsTable({
    events,
}: EventStatisticsTableProps) {
    const [open, setOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventEntity | null>(
        null
    );
    const [modalOpen, setModalOpen] = useState(false);

    const handleEventClick = (event: EventEntity) => {
        setSelectedEvent(event);
        setModalOpen(true);
    };

    const handleModalOpenChange = (isOpen: boolean) => {
        setModalOpen(isOpen);
        if (!isOpen) {
            // Clear selected event when modal closes
            setSelectedEvent(null);
        }
    };

    // Sort events by roll count (descending), then by name
    const sortedEvents = [...events].sort((a, b) => {
        const aCount = a.rolls?.length || 0;
        const bCount = b.rolls?.length || 0;
        if (bCount !== aCount) {
            return bCount - aCount;
        }
        return a.name.localeCompare(b.name);
    });

    const totalRolls = events.reduce(
        (sum, event) => sum + (event.rolls?.length || 0),
        0
    );

    if (events.length === 0) {
        return null;
    }

    return (
        <>
            <Collapsible open={open} onOpenChange={setOpen}>
                <Card>
                    <CollapsibleTrigger className="w-full">
                        <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="size-5 text-primary" />
                                <span className="font-medium">
                                    Event Statistics
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    ({totalRolls} total roll
                                    {totalRolls !== 1 ? "s" : ""})
                                </span>
                            </div>
                            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0 pb-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event Name</TableHead>
                                        <TableHead className="text-right">
                                            Total Rolls
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedEvents.map((event) => {
                                        const rollCount = event.rolls?.length || 0;
                                        return (
                                            <TableRow key={event.id}>
                                                <TableCell>
                                                    <Button
                                                        variant="link"
                                                        className="h-auto p-0 font-medium text-left"
                                                        onClick={() =>
                                                            handleEventClick(event)
                                                        }
                                                    >
                                                        {event.name}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {rollCount}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
            {selectedEvent && (
                <RollStatisticsModal
                    event={selectedEvent}
                    open={modalOpen}
                    onOpenChange={handleModalOpenChange}
                >
                    {/* No trigger needed when using controlled open */}
                </RollStatisticsModal>
            )}
        </>
    );
}
