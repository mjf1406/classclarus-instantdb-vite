/** @format */

import { Home, LayoutDashboard, UserPlus } from "lucide-react";
import {
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    GuardianIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import { Users } from "lucide-react";
import type { NavigationItem } from "./owner-navigation";

export function getAdminNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
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
        ],
    };
}
