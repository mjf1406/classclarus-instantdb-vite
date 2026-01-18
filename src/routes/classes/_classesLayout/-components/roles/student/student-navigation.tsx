/** @format */

import { Users } from "lucide-react";
import { getRestrictedMainItems } from "../../navigation/shared-items";
import type { NavigationItem } from "../../navigation/types";

export function getStudentNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
} {
    return {
        mainItems: [
            ...getRestrictedMainItems(classId),
            {
                title: "Groups & Teams",
                description: "View groups and teams in your class",
                url: `/classes/${classId}/class-management/groups-and-teams`,
                icon: Users,
            },
        ],
        memberItems: [],
    };
}
