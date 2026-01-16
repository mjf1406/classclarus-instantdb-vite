/** @format */

import { useParams } from "@tanstack/react-router";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgRole } from "./use-org-role";
import { getOwnerNavigation } from "./owner-navigation";
import { getAdminNavigation } from "./admin-navigation";
import { getTeacherNavigation } from "./teacher-navigation";
import type { NavigationItem } from "./owner-navigation";

export interface RoleBasedNavigationResult {
    mainItems: NavigationItem[];
    memberItems: NavigationItem[];
    settingsItem?: NavigationItem;
    isLoading: boolean;
}

export function useRoleBasedNavigation(): RoleBasedNavigationResult {
    const params = useParams({ strict: false });
    const orgId = params.orgId;
    const { organization, isLoading } = useOrganizationById(orgId);
    const roleInfo = useOrgRole(organization);

    if (isLoading || !organization || !roleInfo.role || !orgId) {
        return {
            mainItems: [],
            memberItems: [],
            isLoading: true,
        };
    }

    switch (roleInfo.role) {
        case "owner": {
            const nav = getOwnerNavigation(orgId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                settingsItem: nav.settingsItem,
                isLoading: false,
            };
        }
        case "admin": {
            const nav = getAdminNavigation(orgId);
            return {
                mainItems: nav.mainItems,
                memberItems: nav.memberItems,
                isLoading: false,
            };
        }
        case "teacher": {
            const nav = getTeacherNavigation(orgId);
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
