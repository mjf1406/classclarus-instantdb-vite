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

export function NavMain({
    items,
    showLabel = false,
    onLinkClick,
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
    }[];
    showLabel?: boolean;
    onLinkClick?: () => void;
}) {
    return (
        <SidebarGroup>
            {showLabel && <SidebarGroupLabel>Platform</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                            <Link to={item.url} onClick={onLinkClick}>
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
