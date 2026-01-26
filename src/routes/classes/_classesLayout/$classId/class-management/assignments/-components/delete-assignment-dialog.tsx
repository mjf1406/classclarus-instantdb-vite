/** @format */

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type AssignmentEntity = InstaQLEntity<AppSchema, "assignments">;

interface DeleteAssignmentDialogProps {
    assignment: AssignmentEntity;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onDelete?: () => void;
}

export function DeleteAssignmentDialog({
    assignment,
    children,
    asDropdownItem = false,
    onDelete,
}: DeleteAssignmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            db.transact([db.tx.assignments[assignment.id].delete()]);
            setOpen(false);
            onDelete?.();
        } catch (err) {
            console.error("Failed to delete assignment:", err);
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
            className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
            <Trash2 className="size-4" />
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
                    <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{assignment.name}&quot;?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
