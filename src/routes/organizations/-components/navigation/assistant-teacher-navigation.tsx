/** @format */

import { BookOpen } from "lucide-react";
import type { NavigationItem } from "./owner-navigation";

export function getAssistantTeacherNavigation(orgId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
} {
    return {
        mainItems: [
            {
                title: "Classes",
                description:
                    "Manage and organize all classes within this organization",
                url: `/organizations/${orgId}/main/classes`,
                icon: BookOpen,
            },
        ],
        memberItems: [],
    };
}
