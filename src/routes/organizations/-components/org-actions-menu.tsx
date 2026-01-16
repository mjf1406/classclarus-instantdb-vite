/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { EditOrgDialog } from "./edit-org-dialog";
import { DeleteOrgDialog } from "./delete-org-dialog";
import { LeaveOrgDialog } from "./leave-org-dialog";
import { useOrgRole } from "./navigation/use-org-role";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";

type Organization = InstaQLEntity<AppSchema, "organizations">;

interface OrgActionsMenuProps {
    organization: Organization;
}

export function OrgActionsMenu({ organization }: OrgActionsMenuProps) {
    // Determine user's role in the organization
    const roleInfo = useOrgRole(organization as OrganizationWithRelations);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity"
                >
                    <MoreVerticalIcon />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {!roleInfo.isTeacher && (
                    <>
                        <EditOrgDialog organization={organization} asDropdownItem />
                        <DropdownMenuSeparator />
                    </>
                )}
                {roleInfo.isTeacher ? (
                    <LeaveOrgDialog organization={organization} asDropdownItem />
                ) : (
                    <DeleteOrgDialog organization={organization} asDropdownItem />
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
