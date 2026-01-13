/** @format */

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Home, LayoutDashboard, UserPlus, BookOpen, Users } from "lucide-react";
import {
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    ParentIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export const Route = createFileRoute("/organizations/_orgLayout/$orgId/")({
    component: RouteComponent,
});

interface NavigationItem {
    title: string;
    description: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
}

function RouteComponent() {
    const params = useParams({ strict: false });
    const orgId = params.orgId;

    const mainItems: NavigationItem[] = [
        {
            title: "Home",
            description: "That's this page!",
            url: `/organizations/${orgId}`,
            icon: Home,
        },
        {
            title: "Dashboard",
            description:
                "Access analytics, insights, and key metrics for your organization",
            url: `/organizations/${orgId}/main/dashboard`,
            icon: LayoutDashboard,
        },
        {
            title: "Join Org Code",
            description:
                "Generate or view the code for others to join this organization",
            url: `/organizations/${orgId}/main/join-org-code`,
            icon: UserPlus,
        },
        {
            title: "Classes",
            description:
                "Manage and organize all classes within this organization",
            url: `/organizations/${orgId}/main/classes`,
            icon: BookOpen,
        },
    ];

    const memberItems: NavigationItem[] = [
        {
            title: "All Members",
            description:
                "View all members across all roles in the organization",
            url: `/organizations/${orgId}/members`,
            icon: Users,
        },
        {
            title: "Admins",
            description:
                "Manage administrators with full organization access, except deleting the organization itself",
            url: `/organizations/${orgId}/members/admins`,
            icon: AdminIcon,
        },
        {
            title: "Teachers",
            description: "View and manage teachers in the organization",
            url: `/organizations/${orgId}/members/teachers`,
            icon: TeacherIcon,
        },
        {
            title: "Assistant Teachers",
            description: "Manage assistant teachers in the organization",
            url: `/organizations/${orgId}/members/assistant-teachers`,
            icon: AssistantTeacherIcon,
        },
        {
            title: "Parents",
            description:
                "View and manage parent accounts in the organization and their children",
            url: `/organizations/${orgId}/members/parents`,
            icon: ParentIcon,
        },
        {
            title: "Students",
            description:
                "Manage student accounts in the organization and their classes and parents",
            url: `/organizations/${orgId}/members/students`,
            icon: StudentIcon,
        },
    ];

    return (
        <div className="space-y-8 mt-4">
            <div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {mainItems.map((item) => {
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
                                        <CardDescription>
                                            {item.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-2">Members</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {memberItems.map((item) => {
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
                                        <CardDescription>
                                            {item.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
