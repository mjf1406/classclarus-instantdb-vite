/** @format */

import { getRestrictedMainItems } from "../../navigation/shared-items";
import type { NavigationItem } from "../../navigation/types";

export function getGuardianNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
} {
    return {
        mainItems: getRestrictedMainItems(classId),
        memberItems: [],
    };
}
