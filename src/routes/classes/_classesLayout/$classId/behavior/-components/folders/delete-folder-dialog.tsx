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
interface DeleteFolderDialogProps {
    folder: {
        id: string;
        name?: string;
        behaviors?: unknown;
        rewardItems?: unknown;
    };
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onDelete?: () => void;
}

export function DeleteFolderDialog({
    folder,
    children,
    asDropdownItem = false,
    onDelete,
}: DeleteFolderDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const behaviors = (folder.behaviors as Array<{ id: string }> | undefined) ?? [];
            const rewardItems = (folder.rewardItems as Array<{ id: string }> | undefined) ?? [];

            const transactions = [
                ...behaviors.map((b) =>
                    db.tx.behaviors[b.id].unlink({ folder: folder.id })
                ),
                ...rewardItems.map((r) =>
                    db.tx.reward_items[r.id].unlink({ folder: folder.id })
                ),
                db.tx.folders[folder.id].delete(),
            ];

            db.transact(transactions);

            setOpen(false);
            onDelete?.();
        } catch (err) {
            console.error("Failed to delete folder:", err);
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
            className="text-destructive focus:text-destructive"
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
                    <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{folder.name}&quot;?
                        Items in this folder will become uncategorized. This
                        action cannot be undone.
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
