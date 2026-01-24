/** @format */

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useRoleBasedNavigation } from "../-components/navigation/role-based-navigation";
import type { NavigationItem } from "../-components/navigation/types";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { TeachersCard } from "./-components/teachers-card";

export const Route = createFileRoute("/classes/_classesLayout/$classId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading: classLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);
    const { mainItems, memberItems, settingsItem, classManagementItems, randomItems, isLoading } = useRoleBasedNavigation();

    const showTeachersCard = roleInfo.isStudent || roleInfo.isGuardian;

    if (isLoading || classLoading) {
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
            {showTeachersCard && classId && (
                <TeachersCard classId={classId} roleInfo={roleInfo} />
            )}
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

            {classManagementItems && classManagementItems.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold mb-2">Class Management</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {classManagementItems.map((item: NavigationItem) => {
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

            {randomItems && randomItems.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold mb-2">Random Tools</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {randomItems.map((item: NavigationItem) => {
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
                        {memberItems
                            .sort((a, b) => {
                                // Custom order: invite, all, admin, teacher, assistant teacher, guardian, students
                                const order = [
                                    "Invite Members",
                                    "All Members",
                                    "Admins",
                                    "Teachers",
                                    "Assistant Teachers",
                                    "Guardians",
                                    "Students",
                                ];
                                const indexA = order.indexOf(a.title);
                                const indexB = order.indexOf(b.title);
                                if (indexA === -1 && indexB === -1) {
                                    return a.title.localeCompare(b.title);
                                }
                                if (indexA === -1) return 1;
                                if (indexB === -1) return -1;
                                return indexA - indexB;
                            })
                            .map((item: NavigationItem) => {
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
