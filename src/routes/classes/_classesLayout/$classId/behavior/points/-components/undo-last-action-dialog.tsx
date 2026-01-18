/** @format */

import { useState } from "react";
import { db } from "@/lib/db/db";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type LastAction = {
    type: "behavior" | "redemption";
    id: string;
    description: string;
};

interface UndoLastActionDialogProps {
    lastAction: LastAction;
    asDropdownItem?: boolean;
    children?: React.ReactNode;
}

export function UndoLastActionDialog({
    lastAction,
    asDropdownItem = false,
    children,
}: UndoLastActionDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleUndo = async () => {
        setIsDeleting(true);

        try {
            if (lastAction.type === "behavior") {
                db.transact([db.tx.behavior_logs[lastAction.id].delete()]);
            } else {
                db.transact([db.tx.reward_redemptions[lastAction.id].delete()]);
            }
            setOpen(false);
        } catch (err) {
            console.error("Failed to undo action:", err);
        } finally {
            setIsDeleting(false);
        }
    };

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
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Undo last action</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove: {lastAction.description}. This action
                        cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleUndo}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Undoing..." : "Undo"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
