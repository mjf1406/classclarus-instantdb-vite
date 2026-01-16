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
import type { NavigationItem } from "./owner-navigation";

export function getTeacherNavigation(classId: string): {
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
                    "View administrators with full class access",
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
                description: "View and manage assistant teachers in the class",
                url: `/classes/${classId}/members/assistant-teachers`,
                icon: AssistantTeacherIcon,
            },
            {
                title: "Students",
                description:
                    "View and manage student accounts in the class and their parents",
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
