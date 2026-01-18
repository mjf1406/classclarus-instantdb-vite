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
}

export function CardActionMenu({
    children,
    align = "end",
}: CardActionMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
        </DropdownMenu>
    );
}
