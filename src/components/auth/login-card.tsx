/** @format */

import { LogoBig } from "@/components/brand/logo";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GoogleOAuthButton } from "@/components/auth/google-oauth";
import { MagicCodeAuth } from "@/components/auth/magic-code-auth";
import TryAsGuestButton from "@/components/auth/guest-auth";
import GuestDescription from "@/components/guest/guest-description";
import GuestLimitations from "@/components/guest/guest-limitations-section";

export function LoginCard() {
    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-3">
                <div className="flex justify-center">
                    <LogoBig />
                </div>
                <div>
                    <CardTitle className="text-2xl">
                        Welcome to ClassClarus
                    </CardTitle>
                    <CardDescription className="mt-2">
                        Sign in to continue to your account
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <GoogleOAuthButton />
                <MagicCodeAuth />
                <div className="flex items-center gap-4 py-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                </div>
                <TryAsGuestButton />
                <GuestDescription />
                <GuestLimitations />
            </CardContent>
        </Card>
    );
}
