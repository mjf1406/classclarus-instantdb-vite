/** @format */

import {
    getMainItems,
    getBaseMemberItems,
    getSettingsItem,
} from "../../navigation/shared-items";
import {
    getClassManagementItems,
    getRandomItems,
} from "../../navigation/teacher-items";
import type { NavigationItem } from "../../navigation/types";

export function getOwnerNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    settingsItem: NavigationItem;
    classManagementItems: NavigationItem[];
    randomItems: NavigationItem[];
} {
    return {
        mainItems: getMainItems(classId),
        memberItems: getBaseMemberItems(classId),
        settingsItem: getSettingsItem(classId),
        classManagementItems: getClassManagementItems(classId),
        randomItems: getRandomItems(classId),
    };
}
