/** @format */

import { useState } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
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
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TrashIcon } from "lucide-react";

type Organization = InstaQLEntity<AppSchema, "organizations">;

interface DeleteOrgDialogProps {
    organization: Organization;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onDelete?: () => void;
}

export function DeleteOrgDialog({
    organization,
    children,
    asDropdownItem = false,
    onDelete,
}: DeleteOrgDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            db.transact([db.tx.organizations[organization.id].delete()]);
            setOpen(false);
            onDelete?.();
        } catch (err) {
            // Error handling - could be logged or shown to user
            console.error("Failed to delete organization:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    if (asDropdownItem) {
        return (
            <>
                <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    <TrashIcon />
                    Delete
                </DropdownMenuItem>
                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete "{organization.name}"? This action
                                cannot be undone and will also delete all associated classes and data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    const trigger = children || (
        <Button variant="destructive">
            <TrashIcon />
            Delete Organization
        </Button>
    );

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{organization.name}"? This action cannot be
                        undone and will also delete all associated classes and data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
