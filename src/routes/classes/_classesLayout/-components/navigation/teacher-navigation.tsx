/** @format */

import { Home, LayoutDashboard } from "lucide-react";
import type { NavigationItem } from "./owner-navigation";

export function getTeacherNavigation(classId: string): {
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
        memberItems: [],
    };
}
