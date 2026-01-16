/** @format */

import type { ClassByRole } from "@/hooks/use-class-hooks";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { UnarchiveClassDialog } from "./unarchive-class-dialog";
import { DeleteClassDialog } from "./delete-class-dialog";
import { useClassRole } from "./use-class-role";

interface ArchivedClassActionsMenuProps {
    classEntity: ClassByRole;
}

export function ArchivedClassActionsMenu({ classEntity }: ArchivedClassActionsMenuProps) {
    const roleInfo = useClassRole(classEntity);
    
    // Only show menu if user is owner or admin
    if (!roleInfo.isOwner && !roleInfo.isAdmin) {
        return null;
    }

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
                <UnarchiveClassDialog classEntity={classEntity} asDropdownItem />
                <DropdownMenuSeparator />
                <DeleteClassDialog classEntity={classEntity} asDropdownItem />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
