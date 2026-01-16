/** @format */

import { useParams } from "@tanstack/react-router";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "./use-class-role";
import { getOwnerNavigation } from "./owner-navigation";
import { getAdminNavigation } from "./admin-navigation";
import { getTeacherNavigation } from "./teacher-navigation";
import { getAssistantTeacherNavigation } from "./assistant-teacher-navigation";
import { getStudentNavigation } from "./student-navigation";
import { getParentNavigation } from "./parent-navigation";
import type { NavigationItem } from "./owner-navigation";

export interface RoleBasedNavigationResult {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    settingsItem?: NavigationItem;
    isLoading: boolean;
}

export function useRoleBasedNavigation(): RoleBasedNavigationResult {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    if (isLoading || !classEntity || !roleInfo.role || !classId) {
        return {
            mainItems: [],
            memberItems: [],
            isLoading: true,
        };
    }

    switch (roleInfo.role) {
        case "owner": {
            const nav = getOwnerNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                settingsItem: nav.settingsItem,
                isLoading: false,
            };
        }
        case "admin": {
            const nav = getAdminNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                isLoading: false,
            };
        }
        case "teacher": {
            const nav = getTeacherNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                isLoading: false,
            };
        }
        case "assistant-teacher": {
            const nav = getAssistantTeacherNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                isLoading: false,
            };
        }
        case "student": {
            const nav = getStudentNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                isLoading: false,
            };
        }
        case "parent": {
            const nav = getParentNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                isLoading: false,
            };
        }
        default:
            return {
                mainItems: [],
                memberItems: [],
                isLoading: false,
            };
    }
}
