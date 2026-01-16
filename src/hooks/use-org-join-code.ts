/** @format */

import { useOrganizationById } from "./use-organization-hooks";

export function useOrgJoinCode(orgId: string | undefined) {
    const { organization, isLoading: orgLoading } = useOrganizationById(orgId);

    const code = organization?.code;

    return {
        code,
        isLoading: orgLoading,
        error: null,
    };
}
