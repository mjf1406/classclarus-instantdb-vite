/** @format */

import { useState } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
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
import { LogOut } from "lucide-react";

interface LeaveClassDialogProps {
    classEntity: InstaQLEntity<AppSchema, "classes">;
    children?: React.ReactNode;
    onLeave?: () => void;
}

export function LeaveClassDialog({
    classEntity,
    children,
    onLeave,
}: LeaveClassDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthContext();

    const handleLeave = async () => {
        if (!user?.id || !user?.refresh_token) {
            setError("You must be logged in to leave a class");
            return;
        }

        setIsLeaving(true);
        setError(null);

        try {
            // Call the API endpoint
            const response = await fetch("/api/leave/class", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: user.refresh_token,
                },
                body: JSON.stringify({ classId: classEntity.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle different error status codes
                if (response.status === 401) {
                    setError("Authentication failed. Please log in again.");
                } else if (response.status === 403) {
                    setError(
                        data.message ||
                            "Class owners cannot leave their own class."
                    );
                } else if (response.status === 404) {
                    setError(
                        data.message ||
                            "Class not found or you are not a member."
                    );
                } else if (response.status === 429) {
                    setError(
                        data.message ||
                            "Too many requests. Please try again in a minute."
                    );
                } else if (response.status === 400) {
                    setError(data.message || "Invalid request.");
                } else {
                    setError(
                        data.message ||
                            "Failed to leave class. Please try again."
                    );
                }
                return;
            }

            // Success - close dialog and call callback
            setOpen(false);
            setError(null);
            onLeave?.();
        } catch (err) {
            console.error("[Leave Class Dialog] Error leaving:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred. Please try again."
            );
        } finally {
            setIsLeaving(false);
        }
    };

    const trigger = children || (
        <Button variant="outline" size="sm">
            <LogOut className="size-4 mr-2" />
            Leave Class
        </Button>
    );

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Leave Class</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to leave "{classEntity.name}"? You
                        will no longer have access to this class.
                    </AlertDialogDescription>
                    {error && (
                        <div className="mt-2 text-sm text-destructive" role="alert">
                            {error}
                        </div>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLeaving}>
                        Cancel
                    </AlertDialogCancel>
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
