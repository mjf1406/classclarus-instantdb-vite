/** @format */

import { BookOpen } from "lucide-react";
import type { NavigationItem } from "./owner-navigation";

export function getGuardianNavigation(orgId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
} {
    return {
        mainItems: [
            {
                title: "Classes",
                description:
                    "View classes within this organization",
                url: `/organizations/${orgId}/main/classes`,
                icon: BookOpen,
            },
        ],
        memberItems: [],
    };
}
