/** @format */

import { Home, LayoutDashboard, UserPlus, Settings, Monitor, Volume2, Palette } from "lucide-react";
import {
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    GuardianIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import { Users } from "lucide-react";
import type { NavigationItem } from "./types";

export function getMainItems(classId: string): NavigationItem[] {
    return [
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
        {
            title: "Screen",
            description:
                "Display and manage your classroom screen for your class",
            url: `/classes/${classId}/main/classroom-screen`,
            icon: Monitor,
        },
        {
            title: "Noise Monitor",
            description:
                "Monitor and manage classroom noise levels",
            url: `/classes/${classId}/main/noise-monitor`,
            icon: Volume2,
        },
        {
            title: "Place",
            description: "Collaborative pixel art canvas",
            url: `/classes/${classId}/main/canvas`,
            icon: Palette,
        },
    ];
}

/**
 * Get main items for students and guardians (excludes Points and Classroom Screen)
 */
export function getRestrictedMainItems(classId: string): NavigationItem[] {
    return [
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
        {
            title: "Place",
            description: "Collaborative pixel art canvas",
            url: `/classes/${classId}/main/canvas`,
            icon: Palette,
        },
    ];
}

export function getBaseMemberItems(classId: string): NavigationItem[] {
    return [
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
                "Manage student accounts in the class and their guardians",
            url: `/classes/${classId}/members/students`,
            icon: StudentIcon,
        },
        {
            title: "Guardians",
            description:
                "View and manage guardian accounts in the class and their children",
            url: `/classes/${classId}/members/guardians`,
            icon: GuardianIcon,
        },
    ];
}

export function getSettingsItem(classId: string): NavigationItem {
    return {
        title: "Settings",
        description: "Manage class settings and preferences",
        url: `/classes/${classId}/main/settings`,
        icon: Settings,
    };
}
