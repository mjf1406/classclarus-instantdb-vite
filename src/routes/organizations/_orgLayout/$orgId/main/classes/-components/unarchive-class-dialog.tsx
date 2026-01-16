/** @format */

import { useState } from "react";
import type { ClassByRole } from "@/hooks/use-class-hooks";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArchiveRestore } from "lucide-react";

interface UnarchiveClassDialogProps {
    classEntity: ClassByRole;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onUnarchive?: () => void;
}

export function UnarchiveClassDialog({
    classEntity,
    children,
    asDropdownItem = false,
    onUnarchive,
}: UnarchiveClassDialogProps) {
    const [isUnarchiving, setIsUnarchiving] = useState(false);

    const handleUnarchive = async () => {
        setIsUnarchiving(true);

        try {
            const now = new Date();
            db.transact([
                db.tx.classes[classEntity.id].update({
                    archivedAt: null,
                    updated: now,
                }),
            ]);
            onUnarchive?.();
        } catch (err) {
            // Error handling - could be logged or shown to user
            console.error("Failed to unarchive class:", err);
        } finally {
            setIsUnarchiving(false);
        }
    };

    if (asDropdownItem) {
        return (
            <DropdownMenuItem
                onSelect={(e) => {
                    e.preventDefault();
                    handleUnarchive();
                }}
                disabled={isUnarchiving}
            >
                <ArchiveRestore />
                {isUnarchiving ? "Unarchiving..." : "Unarchive"}
            </DropdownMenuItem>
        );
    }

    const trigger = children || (
        <Button variant="outline" onClick={handleUnarchive} disabled={isUnarchiving}>
            <ArchiveRestore />
            {isUnarchiving ? "Unarchiving..." : "Unarchive Class"}
        </Button>
    );

    return trigger;
}
