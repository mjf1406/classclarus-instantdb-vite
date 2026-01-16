/** @format */

import { useState } from "react";
import type { ClassByRole } from "@/hooks/use-class-hooks";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArchiveIcon } from "lucide-react";

interface ArchiveClassDialogProps {
    classEntity: ClassByRole;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onArchive?: () => void;
}

export function ArchiveClassDialog({
    classEntity,
    children,
    asDropdownItem = false,
    onArchive,
}: ArchiveClassDialogProps) {
    const [isArchiving, setIsArchiving] = useState(false);

    const handleArchive = async () => {
        setIsArchiving(true);

        try {
            const now = new Date();
            db.transact([
                db.tx.classes[classEntity.id].update({
                    archivedAt: now,
                    updated: now,
                }),
            ]);
            onArchive?.();
        } catch (err) {
            // Error handling - could be logged or shown to user
            console.error("Failed to archive class:", err);
        } finally {
            setIsArchiving(false);
        }
    };

    if (asDropdownItem) {
        return (
            <DropdownMenuItem
                onSelect={(e) => {
                    e.preventDefault();
                    handleArchive();
                }}
                disabled={isArchiving}
            >
                <ArchiveIcon />
                {isArchiving ? "Archiving..." : "Archive"}
            </DropdownMenuItem>
        );
    }

    const trigger = children || (
        <Button variant="outline" onClick={handleArchive} disabled={isArchiving}>
            <ArchiveIcon />
            {isArchiving ? "Archiving..." : "Archive Class"}
        </Button>
    );

    return trigger;
}
