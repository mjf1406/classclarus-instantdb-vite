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
import { EditClassDialog } from "./edit-class-dialog";
import { ArchiveClassDialog } from "./archive-class-dialog";
import { useClassRole } from "@/hooks/use-class-role";

interface ClassActionsMenuProps {
    classEntity: ClassByRole;
}

export function ClassActionsMenu({ classEntity }: ClassActionsMenuProps) {
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
                <EditClassDialog classEntity={classEntity} asDropdownItem />
                <DropdownMenuSeparator />
                <ArchiveClassDialog classEntity={classEntity} asDropdownItem />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
