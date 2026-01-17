/** @format */

import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { ImageSkeleton } from "@/components/ui/image-skeleton";

export const Route = createFileRoute("/blocked/")({
    component: Blocked,
});

function Blocked() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-3">
                    <div className="flex justify-center">
                        <ImageSkeleton
                            src="/brand/logo-403.webp"
                            alt="403 Forbidden"
                            width={327}
                            height={341}
                        />
                    </div>
                    <div>
                        <CardTitle className="text-2xl flex items-center justify-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            403 Forbidden
                        </CardTitle>
                        <CardDescription className="mt-2">
                            You don't have permission to access this page.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button
                        asChild
                        variant="default"
                        className="w-full"
                        size="lg"
                    >
                        <Link to="/organizations">Go to Organizations</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="w-full"
                        size="lg"
                    >
                        <Link
                            to="/"
                            search={{ redirect: undefined }}
                        >
                            Go to Home
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
