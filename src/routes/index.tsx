/** @format */

import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/components/auth/auth-provider";
import { LoginCard } from "@/components/auth/login-card";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db/db";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";
import LoadingPage from "@/components/auth/loading-page";

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

    // Reset ref when user logs out
    useEffect(() => {
        if (!isLoading && !user?.id && wasLoggedOutRef.current === false) {
            wasLoggedOutRef.current = null;
        }
    }, [isLoading, user]);

    // Redirect to /organizations when user logs in (but not if they were already logged in)
    useEffect(() => {
        if (wasLoggedOutRef.current && user?.id && !isLoading) {
            navigate({ to: "/organizations" });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return <LoadingPage />;
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
                            onClick={() => {
                                db.auth.signOut();
                                navigate({ to: "/" });
                            }}
                        >
                            Logout
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // User is not logged in - show login options
    // Use key based on user state to force remount when auth state changes
    const loginCardKey = user?.id || "logged-out";
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeSwitcher />
            </div>
            <LoginCard key={loginCardKey} />
        </div>
    );
}
