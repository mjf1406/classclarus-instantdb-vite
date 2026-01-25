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
import type { AssignerType } from "./assigner-form";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type AssignerEntity =
    | InstaQLEntity<AppSchema, "random_assigners">
    | InstaQLEntity<AppSchema, "rotating_assigners">
    | InstaQLEntity<AppSchema, "equitable_assigners">;

interface DeleteAssignerDialogProps {
    assignerType: AssignerType;
    assigner: AssignerEntity;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onDelete?: () => void;
}

const ASSIGNER_TYPE_CONFIG: Record<AssignerType, { title: string; entityName: string }> = {
    random: {
        title: "Delete Random Assigner",
        entityName: "random_assigners",
    },
    rotating: {
        title: "Delete Rotating Assigner",
        entityName: "rotating_assigners",
    },
    equitable: {
        title: "Delete Equitable Assigner",
        entityName: "equitable_assigners",
    },
};

export function DeleteAssignerDialog({
    assignerType,
    assigner,
    children,
    asDropdownItem = false,
    onDelete,
}: DeleteAssignerDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const config = ASSIGNER_TYPE_CONFIG[assignerType];

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            db.transact([
                db.tx[config.entityName as keyof typeof db.tx][assigner.id].delete(),
            ]);
            setOpen(false);
            onDelete?.();
        } catch (err) {
            console.error("Failed to delete assigner:", err);
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
                    <AlertDialogTitle>{config.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;{assigner.name}&quot;?
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
