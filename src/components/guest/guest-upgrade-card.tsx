/** @format */

import { Mail } from "lucide-react";

import { MagicCodeAuth } from "../auth/magic-code-auth";
import {
    GoogleOAuthButton,
    GoogleOAuthButtonSmall,
} from "../auth/google-oauth";
import { Button } from "../ui/button";
import GuestDataDeletionCountdown from "./guest-data-deletion-countdown";

interface GuestUpgradeCardProps {
    size?: "default" | "small";
}

export default function GuestUpgradeCard({
    size = "default",
}: GuestUpgradeCardProps) {
    if (size === "small") {
        return <GuestUpgradeCardSmall />;
    }

    return (
        <div className="max-w-md border-4 border-yellow-400 dark:border-yellow-600 bg-yellow-200 dark:bg-yellow-300 text-black p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Upgrade Your Account</h2>
            <p className="mb-4">
                Guest users have very limited access. Sign in to get higher
                limits; it&apos;s free!
            </p>
            <GuestDataDeletionCountdown />
            <div className="space-y-3">
                <MagicCodeAuth />
                <GoogleOAuthButton />
            </div>
        </div>
    );
}

function GuestUpgradeCardSmall() {
    return (
        <div className="w-full max-w-2xs border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-200 dark:bg-yellow-300 text-black px-3 py-2.5 rounded-md">
            <p className="text-xs font-medium mb-2 leading-tight">
                Guest users have very limited access. Sign in to get higher
                limits; it&apos;s free!
            </p>
            <GuestDataDeletionCountdown />
            <div className="flex gap-2">
                <MagicCodeAuth
                    trigger={
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                        >
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            Email
                        </Button>
                    }
                />
                <GoogleOAuthButtonSmall />
            </div>
        </div>
    );
}
