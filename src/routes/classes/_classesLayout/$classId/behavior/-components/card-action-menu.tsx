/** @format */

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface CardActionMenuProps {
    children: React.ReactNode;
    align?: "start" | "center" | "end";
    triggerClassName?: string;
}

export function CardActionMenu({
    children,
    align = "end",
    triggerClassName = "h-8 w-8",
}: CardActionMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={triggerClassName}>
                    <MoreVertical className="size-4" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
        </DropdownMenu>
    );
}
