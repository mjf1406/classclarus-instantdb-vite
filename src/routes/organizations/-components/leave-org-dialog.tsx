/** @format */

import { useState } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useNavigate } from "@tanstack/react-router";
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
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const handleLeave = async () => {
        if (!user?.id || !user?.refresh_token) {
            setError("You must be logged in to leave an organization");
            return;
        }

        setIsLeaving(true);
        setError(null);

        try {
            // Call the API endpoint
            const response = await fetch("/api/leave/organization", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: user.refresh_token,
                },
                body: JSON.stringify({ organizationId: organization.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle different error status codes
                if (response.status === 401) {
                    setError("Authentication failed. Please log in again.");
                } else if (response.status === 403) {
                    setError(
                        data.message ||
                            "Organization owners cannot leave their own organization."
                    );
                } else if (response.status === 404) {
                    setError(
                        data.message ||
                            "Organization not found or you are not a member."
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
                            "Failed to leave organization. Please try again."
                    );
                }
                return;
            }

            // Success - close dialog, call callback, and navigate
            setOpen(false);
            setError(null);
            onLeave?.();
            
            // Navigate to organizations list after a short delay to allow InstantDB to sync
            setTimeout(() => {
                navigate({ to: "/organizations" });
            }, 500);
        } catch (err) {
            console.error("[Leave Organization Dialog] Error leaving:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred. Please try again."
            );
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
                            {error && (
                                <div className="mt-2 text-sm text-destructive" role="alert">
                                    {error}
                                </div>
                            )}
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
                    {error && (
                        <div className="mt-2 text-sm text-destructive" role="alert">
                            {error}
                        </div>
                    )}
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
