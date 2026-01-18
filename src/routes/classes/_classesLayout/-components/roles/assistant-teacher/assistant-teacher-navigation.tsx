/** @format */

import { getMainItems } from "../../navigation/shared-items";
import {
    getClassManagementItems,
    getRandomItems,
    getBehaviorItems,
} from "../../navigation/teacher-items";
import type { NavigationItem } from "../../navigation/types";

export function getAssistantTeacherNavigation(classId: string): {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    classManagementItems: NavigationItem[];
    randomItems: NavigationItem[];
    behaviorItems: NavigationItem[];
} {
    return {
        mainItems: getMainItems(classId),
        memberItems: [],
        classManagementItems: getClassManagementItems(classId),
        randomItems: getRandomItems(classId),
        behaviorItems: getBehaviorItems(classId),
    };
}
