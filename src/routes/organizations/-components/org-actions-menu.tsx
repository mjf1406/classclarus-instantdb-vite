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

type Organization = InstaQLEntity<AppSchema, "organizations">;

interface OrgActionsMenuProps {
    organization: Organization;
}

export function OrgActionsMenu({ organization }: OrgActionsMenuProps) {
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
                <EditOrgDialog organization={organization} asDropdownItem />
                <DropdownMenuSeparator />
                <DeleteOrgDialog organization={organization} asDropdownItem />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
