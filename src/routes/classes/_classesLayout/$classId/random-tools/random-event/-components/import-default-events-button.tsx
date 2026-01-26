/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import defaultEvents from "@/lib/defaults/default_random_events.json";

interface ImportDefaultEventsButtonProps {
    classId: string;
    existingEventNames?: string[];
}

export function ImportDefaultEventsButton({
    classId,
    existingEventNames = [],
}: ImportDefaultEventsButtonProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [importedCount, setImportedCount] = useState<number | null>(null);

    const handleImport = async () => {
        setIsImporting(true);
        setImportedCount(null);

        try {
            const now = new Date();

            // Filter out events that already exist (by name)
            const eventsToImport = defaultEvents.filter(
                (event) => !existingEventNames.includes(event.name)
            );

            if (eventsToImport.length === 0) {
                alert("All default events have already been imported.");
                setIsImporting(false);
                return;
            }

            // Create transactions for each event
            const transactions = eventsToImport.flatMap((event) => {
                const eventId = id();
                return [
                    db.tx.random_events[eventId].create({
                        name: event.name,
                        description: event.description || undefined,
                        imageUrl: event.image || undefined,
                        audioUrl: event.audio || undefined,
                        created: now,
                        updated: now,
                    }),
                    db.tx.random_events[eventId].link({ class: classId }),
                ];
            });

            // Execute all transactions
            db.transact(transactions);

            setImportedCount(eventsToImport.length);
            
            // Reset the count after 3 seconds
            setTimeout(() => {
                setImportedCount(null);
            }, 3000);
        } catch (err) {
            console.error("Failed to import default events:", err);
            alert(
                err instanceof Error
                    ? err.message
                    : "Failed to import default events. Please try again."
            );
        } finally {
            setIsImporting(false);
        }
    };

    const hasAllEvents =
        existingEventNames.length > 0 &&
        defaultEvents.every((event) => existingEventNames.includes(event.name));

    return (
        <Button
            onClick={handleImport}
            disabled={isImporting || hasAllEvents}
            size="lg"
            variant="outline"
            className="gap-2"
        >
            {importedCount !== null ? (
                <>
                    <Check className="size-4" />
                    <span className="hidden md:inline">
                        Imported {importedCount} event{importedCount !== 1 ? "s" : ""}
                    </span>
                    <span className="md:hidden">{importedCount} imported</span>
                </>
            ) : (
                <>
                    <Download className="size-4" />
                    {isImporting ? (
                        <span>Importing...</span>
                    ) : hasAllEvents ? (
                        <span className="hidden md:inline">All Events Imported</span>
                    ) : (
                        <>
                            <span className="hidden md:inline">
                                Import Default Events
                            </span>
                            <span className="md:hidden">Import</span>
                        </>
                    )}
                </>
            )}
        </Button>
    );
}
