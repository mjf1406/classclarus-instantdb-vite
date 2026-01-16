/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useOrganizationById } from "./use-organization-hooks";

export type OrgJoinCode = InstaQLEntity<AppSchema, "orgJoinCodes">;

export function useOrgJoinCode(orgId: string | undefined) {
    const { organization, isLoading: orgLoading } = useOrganizationById(orgId);

    const joinCode = organization?.joinCodeEntity as OrgJoinCode | undefined;
    const code = joinCode?.code;

    return {
        joinCode,
        code,
        codeId: joinCode?.id,
        isLoading: orgLoading,
        error: null,
    };
}
