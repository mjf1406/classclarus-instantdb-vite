/** @format */

import { createFileRoute, Link } from "@tanstack/react-router";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useRoleBasedNavigation } from "../-components/navigation/role-based-navigation";
import type { NavigationItem } from "../-components/navigation/owner-navigation";

export const Route = createFileRoute("/classes/_classesLayout/$classId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { mainItems, memberItems, settingsItem, isLoading } = useRoleBasedNavigation();

    if (isLoading) {
        return (
            <div className="space-y-8 mt-4">
                <div className="text-muted-foreground">Loading navigation...</div>
            </div>
        );
    }

    const allMainItems = settingsItem
        ? [...mainItems, settingsItem]
        : mainItems;

    return (
        <div className="space-y-8 mt-4">
            {allMainItems.length > 0 && (
                <div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {allMainItems.map((item: NavigationItem) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.url}
                                    to={item.url as any}
                                    className="block"
                                >
                                    <Card className="h-full transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20 cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Icon className="h-5 w-5 text-primary" />
                                                <CardTitle>{item.title}</CardTitle>
                                            </div>
                                            {item.description && (
                                                <CardDescription>
                                                    {item.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {memberItems.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold mb-2">Members</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {memberItems.map((item: NavigationItem) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.url}
                                    to={item.url as any}
                                    className="block"
                                >
                                    <Card className="h-full transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20 cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Icon className="h-5 w-5 text-primary" />
                                                <CardTitle>{item.title}</CardTitle>
                                            </div>
                                            {item.description && (
                                                <CardDescription>
                                                    {item.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
