/** @format */

import {
    getMainItems,
    getBaseMemberItems,
} from "../../navigation/shared-items";
import {
    getClassManagementItems,
    getRandomItems,
} from "../../navigation/teacher-items";
import type { NavigationItem } from "../../navigation/types";

export function getAdminNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    classManagementItems: NavigationItem[];
    randomItems: NavigationItem[];
} {
    return {
        mainItems: getMainItems(classId),
        memberItems: getBaseMemberItems(classId),
        classManagementItems: getClassManagementItems(classId),
        randomItems: getRandomItems(classId),
    };
}
