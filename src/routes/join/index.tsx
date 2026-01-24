/** @format */

import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";

export const Route = createFileRoute("/join/")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Join</CardTitle>
                    <CardDescription>
                        Choose what you want to join
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button size="lg" variant="outline" className="w-full" asChild>
                        <Link to="/join/organization">
                            <UserPlus className="size-5 mr-2" />
                            Join Organization
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full" asChild>
                        <Link to="/join/class" search={{ code: undefined }}>
                            <LogIn className="size-5 mr-2" />
                            Join Class
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
