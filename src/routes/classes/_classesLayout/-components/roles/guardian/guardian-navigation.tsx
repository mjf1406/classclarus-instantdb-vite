/** @format */

import { Users } from "lucide-react";
import { getBehaviorItemsViewOnly } from "../../navigation/teacher-items";
import { getRestrictedMainItems } from "../../navigation/shared-items";
import type { NavigationItem } from "../../navigation/types";

export function getGuardianNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    behaviorItems?: NavigationItem[];
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
        behaviorItems: getBehaviorItemsViewOnly(classId),
    };
}
