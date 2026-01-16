/** @format */

import { Home } from "lucide-react";
import type { NavigationItem } from "./owner-navigation";

export function getStudentNavigation(classId: string): {
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
        ],
        memberItems: [],
    };
}
