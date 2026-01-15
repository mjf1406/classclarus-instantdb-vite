/** @format */

import { Home, LayoutDashboard, UserPlus, BookOpen } from "lucide-react";
import {
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    ParentIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import { Users } from "lucide-react";
import type { NavigationItem } from "./owner-navigation";

export function getAdminNavigation(orgId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
} {
    return {
        mainItems: [
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
                title: "Classes",
                description:
                    "Manage and organize all classes within this organization",
                url: `/organizations/${orgId}/main/classes`,
                icon: BookOpen,
            },
        ],
        memberItems: [
            {
                title: "Invite Members",
                description:
                    "Generate or view the code for others to join this organization",
                url: `/organizations/${orgId}/members/invite`,
                icon: UserPlus,
            },
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
        ],
    };
}
