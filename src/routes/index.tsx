/** @format */

import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/components/auth/auth-provider";
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
import LoadingPage from "@/components/loading/loading-page";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    const { user, isLoading } = useAuthContext();
    const navigate = useNavigate();

    // Redirect unauthenticated users to /login
    useEffect(() => {
        if (!isLoading && !user?.id) {
            navigate({ to: "/login" });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return <LoadingPage />;
    }

    // If user is not authenticated, don't render anything (redirect will happen)
    if (!user?.id) {
        return null;
    }

    // User is logged in - show greeting and link to organizations
    const displayName = user.firstName || user.email?.split("@")[0] || "there";

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
                        You're all set. Click below to go to your organizations.
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
                            navigate({ to: "/login" });
                        }}
                    >
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
