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

export function getTeacherNavigation(classId: string): {
    mainItems: NavigationItem[];
    classManagementItems: NavigationItem[];
    randomItems: NavigationItem[];
    memberItems: NavigationItem[];
    settingsItem: NavigationItem;
} {
    return {
        mainItems: getMainItems(classId),
        classManagementItems: getClassManagementItems(classId),
        randomItems: getRandomItems(classId),
        memberItems: getBaseMemberItems(classId),
        settingsItem: getSettingsItem(classId),
    };
}
