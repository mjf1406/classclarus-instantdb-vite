/** @format */

import { useParams } from "@tanstack/react-router";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { getOwnerNavigation } from "../roles/admin-owner/owner-navigation";
import { getAdminNavigation } from "../roles/admin-owner/admin-navigation";
import { getTeacherNavigation } from "../roles/teacher/teacher-navigation";
import { getAssistantTeacherNavigation } from "../roles/assistant-teacher/assistant-teacher-navigation";
import { getStudentNavigation } from "../roles/student/student-navigation";
import { getGuardianNavigation } from "../roles/guardian/guardian-navigation";
import type { NavigationItem } from "./types";

export interface RoleBasedNavigationResult {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    settingsItem?: NavigationItem;
    classManagementItems?: NavigationItem[];
    randomItems?: NavigationItem[];
    behaviorItems?: NavigationItem[];
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
            behaviorItems: [],
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
                classManagementItems: nav.classManagementItems,
                randomItems: nav.randomItems,
                behaviorItems: nav.behaviorItems,
                isLoading: false,
            };
        }
        case "admin": {
            const nav = getAdminNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                classManagementItems: nav.classManagementItems,
                randomItems: nav.randomItems,
                behaviorItems: nav.behaviorItems,
                isLoading: false,
            };
        }
        case "teacher": {
            const nav = getTeacherNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                settingsItem: nav.settingsItem,
                classManagementItems: nav.classManagementItems,
                randomItems: nav.randomItems,
                behaviorItems: nav.behaviorItems,
                isLoading: false,
            };
        }
        case "assistant-teacher": {
            const nav = getAssistantTeacherNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                classManagementItems: nav.classManagementItems,
                randomItems: nav.randomItems,
                behaviorItems: nav.behaviorItems,
                isLoading: false,
            };
        }
        case "student": {
            const nav = getStudentNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                behaviorItems: nav.behaviorItems,
                isLoading: false,
            };
        }
        case "guardian": {
            const nav = getGuardianNavigation(classId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                behaviorItems: nav.behaviorItems,
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
