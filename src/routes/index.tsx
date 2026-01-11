/** @format */

import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/components/auth/auth-provider";
import { GoogleOAuthButton } from "@/components/auth/google-oauth";
import { MagicCodeAuth } from "@/components/auth/magic-code-auth";
import TryAsGuestButton from "@/components/auth/guest-auth";
import { LogoBig } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import GuestDescription from "@/components/guest/guest-description";
import GuestLimitations from "@/components/guest/guest-limitations-section";
import { db } from "@/lib/db/db";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const { user, isLoading } = useAuthContext();
    const navigate = useNavigate();
    const wasLoggedOutRef = useRef<boolean | null>(null);

    // Track initial auth state after loading completes
    useEffect(() => {
        if (!isLoading && wasLoggedOutRef.current === null) {
            wasLoggedOutRef.current = !user?.id;
        }
    }, [isLoading, user]);

    // Redirect to /organizations when user logs in (but not if they were already logged in)
    useEffect(() => {
        if (wasLoggedOutRef.current && user?.id && !isLoading) {
            navigate({ to: "/organizations" });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col min-w-screen min-h-screen items-center justify-center gap-1">
                <Loader2 className="h-16 w-16 animate-spin text-foreground" />
                <span className="text-muted-foreground text-lg">
                    Loading...
                </span>
            </div>
        );
    }

    // User is logged in - show greeting and link to organizations
    if (user && user.id) {
        const displayName =
            user.firstName || user.email?.split("@")[0] || "there";

        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="absolute top-4 right-4">
                    <ThemeSwitcher />
                </div>
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            Hey {displayName}!
                        </CardTitle>
                        <CardDescription>
                            You're all set. Click below to go to your
                            organizations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            asChild
                            variant="default"
                            className="w-full"
                            size="lg"
                        >
                            <Link
                                to="/organizations"
                                className="text-background!"
                            >
                                Go to Organizations
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            onClick={() => db.auth.signOut()}
                        >
                            Logout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // User is not logged in - show login options
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeSwitcher />
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
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
                <CardContent className="space-y-3">
                    <GoogleOAuthButton />
                    <MagicCodeAuth />
                    <div className="flex items-center gap-4 py-2">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                            OR
                        </span>
                        <Separator className="flex-1" />
                    </div>
                    <TryAsGuestButton />
                    <GuestDescription />
                    <GuestLimitations />
                </CardContent>
            </Card>
        </div>
    );
}
