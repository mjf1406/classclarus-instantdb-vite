/** @format */

"use client";

import { type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavMain({
    items,
    showLabel = false,
    label,
    onLinkClick,
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
    }[];
    showLabel?: boolean;
    label?: string;
    onLinkClick?: () => void;
}) {
    return (
        <SidebarGroup>
            {showLabel && label && (
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
            )}
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            isActive={item.isActive}
                            className={cn(
                                item.isActive && "bg-primary/70! text-white!"
                            )}
                        >
                            <Link
                                to={item.url}
                                onClick={onLinkClick}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
