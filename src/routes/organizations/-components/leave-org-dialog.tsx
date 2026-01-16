/** @format */

import { useState } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
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
import { LogOutIcon } from "lucide-react";

type Organization = InstaQLEntity<AppSchema, "organizations">;

interface LeaveOrgDialogProps {
    organization: Organization;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onLeave?: () => void;
}

export function LeaveOrgDialog({
    organization,
    children,
    asDropdownItem = false,
    onLeave,
}: LeaveOrgDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const { user } = useAuthContext();
    const userId = user?.id;

    const handleLeave = async () => {
        if (!userId) return;

        setIsLeaving(true);

        try {
            db.transact([
                db.tx.organizations[organization.id].unlink({
                    orgTeachers: userId,
                }),
            ]);
            setOpen(false);
            onLeave?.();
        } catch (err) {
            // Error handling - could be logged or shown to user
            console.error("Failed to leave organization:", err);
        } finally {
            setIsLeaving(false);
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
                    <LogOutIcon />
                    Leave Organization
                </DropdownMenuItem>
                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Leave Organization</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to leave "{organization.name}"? You will no
                                longer have access to this organization or its classes.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleLeave}
                                disabled={isLeaving}
                            >
                                {isLeaving ? "Leaving..." : "Leave"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    const trigger = children || (
        <Button variant="destructive">
            <LogOutIcon />
            Leave Organization
        </Button>
    );

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Leave Organization</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to leave "{organization.name}"? You will no longer
                        have access to this organization or its classes.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleLeave}
                        disabled={isLeaving}
                    >
                        {isLeaving ? "Leaving..." : "Leave"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
