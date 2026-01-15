/** @format */

import { createFileRoute } from "@tanstack/react-router";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Settings } from "lucide-react";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/main/settings"
)({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Organization Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                        Manage your organization's general settings and
                        preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Settings configuration will be available here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
