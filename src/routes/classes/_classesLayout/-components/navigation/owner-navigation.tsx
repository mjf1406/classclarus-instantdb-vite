/** @format */

import {
    Home,
    LayoutDashboard,
    UserPlus,
    Settings,
} from "lucide-react";
import {
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    ParentIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import { Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
    title: string;
    description?: string;
    url: string;
    icon: LucideIcon | React.ComponentType<{ className?: string }>;
}

export function getOwnerNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    settingsItem: NavigationItem;
} {
    return {
        mainItems: [
            {
                title: "Home",
                description: "That's this page!",
                url: `/classes/${classId}`,
                icon: Home,
            },
            {
                title: "Dashboard",
                description:
                    "Access analytics, insights, and key metrics for your class",
                url: `/classes/${classId}/main/dashboard`,
                icon: LayoutDashboard,
            },
        ],
        memberItems: [
            {
                title: "Invite Members",
                description:
                    "View the join codes for others to join this class",
                url: `/classes/${classId}/members/invite`,
                icon: UserPlus,
            },
            {
                title: "All Members",
                description:
                    "View all members across all roles in the class",
                url: `/classes/${classId}/members`,
                icon: Users,
            },
            {
                title: "Admins",
                description:
                    "Manage administrators with full class access, except deleting the class itself",
                url: `/classes/${classId}/members/admins`,
                icon: AdminIcon,
            },
            {
                title: "Teachers",
                description: "View and manage teachers in the class",
                url: `/classes/${classId}/members/teachers`,
                icon: TeacherIcon,
            },
            {
                title: "Assistant Teachers",
                description: "Manage assistant teachers in the class",
                url: `/classes/${classId}/members/assistant-teachers`,
                icon: AssistantTeacherIcon,
            },
            {
                title: "Students",
                description:
                    "Manage student accounts in the class and their parents",
                url: `/classes/${classId}/members/students`,
                icon: StudentIcon,
            },
            {
                title: "Parents",
                description:
                    "View and manage parent accounts in the class and their children",
                url: `/classes/${classId}/members/parents`,
                icon: ParentIcon,
            },
        ],
        settingsItem: {
            title: "Settings",
            description: "Manage class settings and preferences",
            url: `/classes/${classId}/main/settings`,
            icon: Settings,
        },
    };
}
