/** @format */

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { BarChart3, Calendar } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type EventEntity = InstaQLEntity<
    AppSchema,
    "random_events",
    { rolls?: {} }
>;
type RollEntity = InstaQLEntity<AppSchema, "random_event_rolls">;

interface RollStatisticsModalProps {
    event: EventEntity;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function RollStatisticsModal({
    event,
    children,
    asDropdownItem = false,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: RollStatisticsModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;

    // Sort rolls by most recent first
    const sortedRolls = useMemo(() => {
        if (!event.rolls || event.rolls.length === 0) return [];
        return [...event.rolls].sort((a: RollEntity, b: RollEntity) => {
            const dateA = a.rolledAt ? new Date(a.rolledAt).getTime() : 0;
            const dateB = b.rolledAt ? new Date(b.rolledAt).getTime() : 0;
            return dateB - dateA; // Descending (most recent first)
        });
    }, [event.rolls]);

    const rollCount = event.rolls?.length || 0;

    const trigger = asDropdownItem ? (
        <DropdownMenuItem
            onSelect={(e) => {
                e.preventDefault();
                setOpen(true);
            }}
            className="flex items-center gap-2"
        >
            {children}
        </DropdownMenuItem>
    ) : (
        children
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl">
                        {event.name} - Roll Statistics
                    </DialogTitle>
                    <DialogDescription>
                        {event.description || "View roll history and statistics"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted">
                        <BarChart3 className="size-5 text-primary" />
                        <div>
                            <p className="font-semibold">Total Rolls</p>
                            <p className="text-2xl font-bold">{rollCount}</p>
                        </div>
                    </div>
                    {rollCount > 0 ? (
                        <div>
                            <h3 className="text-sm font-semibold mb-2">
                                Roll History
                            </h3>
                            <ScrollArea className="h-[400px] rounded-md border p-4">
                                <div className="space-y-2">
                                    {sortedRolls.map((roll: RollEntity) => {
                                        const rollDate = roll.rolledAt
                                            ? new Date(roll.rolledAt)
                                            : null;
                                        const formattedDate = rollDate
                                            ? format(
                                                  rollDate,
                                                  "MMM d, yyyy 'at' h:mm a"
                                              )
                                            : "Unknown date";

                                        return (
                                            <div
                                                key={roll.id}
                                                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                                            >
                                                <Calendar className="size-4 text-muted-foreground shrink-0" />
                                                <span className="text-sm">
                                                    {formattedDate}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>This event has not been rolled yet.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
