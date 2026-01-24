/** @format */

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
    userEmail: string;
    children?: React.ReactNode;
}

export function DeleteAccountDialog({
    userEmail,
    children,
}: DeleteAccountDialogProps) {
    const { user } = useAuthContext();
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState("");
    const [confirmationText, setConfirmationText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const isConfirmValid =
        confirmationEmail.trim().toLowerCase() === userEmail.toLowerCase() &&
        confirmationText.trim() === "DELETE";

    const handleDelete = async () => {
        if (!isConfirmValid) {
            setError("Please enter your email and type DELETE correctly");
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            if (!user?.refresh_token) {
                setError("Authentication required. Please refresh the page.");
                setIsDeleting(false);
                return;
            }

            const response = await fetch("/api/user/delete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: user.refresh_token,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || "Failed to delete account"
                );
            }

            // Sign out and redirect
            await db.auth.signOut();
            navigate({
                to: "/",
                search: { redirect: undefined },
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete account. Please try again."
            );
            setIsDeleting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !isDeleting) {
            setConfirmationEmail("");
            setConfirmationText("");
            setError(null);
        }
        setOpen(newOpen);
    };

    const trigger = children || (
        <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
        </Button>
    );

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent size="default" className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left space-y-3">
                        <p>
                            This action cannot be undone. This will permanently
                            delete your account and all associated data,
                            including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>All your organizations and classes</li>
                            <li>All behavior logs and reward redemptions</li>
                            <li>All student expectations and preferences</li>
                            <li>All files and uploaded content</li>
                            <li>All relationships and memberships</li>
                        </ul>
                        <p className="font-medium mt-4">
                            To confirm, please enter your email address and type
                            "DELETE" below:
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="confirm-email">Your Email</Label>
                        <Input
                            id="confirm-email"
                            type="email"
                            value={confirmationEmail}
                            onChange={(e) =>
                                setConfirmationEmail(e.target.value)
                            }
                            placeholder={userEmail}
                            disabled={isDeleting}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirm-text">Type DELETE</Label>
                        <Input
                            id="confirm-text"
                            type="text"
                            value={confirmationText}
                            onChange={(e) =>
                                setConfirmationText(e.target.value)
                            }
                            placeholder="DELETE"
                            disabled={isDeleting}
                            className="mt-1"
                        />
                    </div>
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || !isConfirmValid}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
