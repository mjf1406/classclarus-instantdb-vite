/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type LastBehavior = {
    behaviorId: string;
    behavior: { name: string; points: number };
};

interface RepeatLastBehaviorDialogProps {
    lastBehavior: LastBehavior;
    studentId: string;
    classId: string;
    asDropdownItem?: boolean;
    children?: React.ReactNode;
}

export function RepeatLastBehaviorDialog({
    lastBehavior,
    studentId,
    classId,
    asDropdownItem = false,
    children,
}: RepeatLastBehaviorDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuthContext();

    const pts = lastBehavior.behavior.points ?? 0;
    const pointsStr = pts >= 0 ? `+${pts}` : String(pts);

    const handleRepeat = async () => {
        if (!user?.id) return;
        setIsSubmitting(true);

        try {
            const newId = id();
            db.transact(
                db.tx.behavior_logs[newId]
                    .create({ createdAt: new Date() })
                    .link({ class: classId })
                    .link({ behavior: lastBehavior.behaviorId })
                    .link({ student: studentId })
                    .link({ createdBy: user.id })
            );
            setOpen(false);
        } catch (err) {
            console.error("Failed to repeat behavior:", err);
        } finally {
            setIsSubmitting(false);
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
                    <AlertDialogTitle>Repeat last behavior</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apply again: {lastBehavior.behavior.name} ({pointsStr})?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRepeat}
                        disabled={isSubmitting || !user?.id}
                    >
                        {isSubmitting ? "Repeating..." : "Repeat"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
