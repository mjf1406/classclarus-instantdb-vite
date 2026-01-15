/** @format */

"use client";

import * as React from "react";
import { useParams, Link } from "@tanstack/react-router";

import { NavMain } from "./org-main";
import { NavUser } from "@/components/navigation/nav-user";
import { OrgSidebarHeader } from "./org-sidebar-header";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef } from "react";
import { useRoleBasedNavigation } from "../navigation/role-based-navigation";
import type { LucideIcon } from "lucide-react";
import { Home, BookOpen, Book } from "lucide-react";

const STORAGE_KEY_PREFIX = "org-sidebar-preference-";

function getStorageKey(route: string) {
    return `${STORAGE_KEY_PREFIX}${route}`;
}

export function OrgSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const params = useParams({ strict: false });
    const isIndexRoute = !params.orgId;
    const currentRoute = params.orgId || "index";
    const { open, setOpen, setOpenMobile, isMobile } = useSidebar();
    const lastRouteRef = useRef<string>(currentRoute);
    const programmaticStateRef = useRef<boolean | null>(open);
    const isAdjustingRef = useRef(false);
    const { mainItems, memberItems, settingsItem, isLoading } = useRoleBasedNavigation();

    // Close sidebar on mobile when a link is clicked
    const handleLinkClick = React.useCallback(() => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }, [isMobile, setOpenMobile]);

    useEffect(() => {
        if (lastRouteRef.current !== currentRoute) {
            lastRouteRef.current = currentRoute;
            programmaticStateRef.current = null;
        }
    }, [currentRoute]);

    useEffect(() => {
        const storageKey = getStorageKey(currentRoute);
        const userPreference = localStorage.getItem(storageKey);

        let targetState: boolean;
        if (userPreference !== null) {
            targetState = userPreference === "true";
        } else {
            targetState = !isIndexRoute;
        }

        if (open !== targetState) {
            isAdjustingRef.current = true;
            setOpen(targetState);
            programmaticStateRef.current = targetState;

            const timeoutId = setTimeout(() => {
                isAdjustingRef.current = false;
            }, 100);
            return () => clearTimeout(timeoutId);
        } else {
            if (programmaticStateRef.current === null) {
                programmaticStateRef.current = open;
            }
        }
    }, [isIndexRoute, currentRoute]);

    useEffect(() => {
        if (
            !isAdjustingRef.current &&
            programmaticStateRef.current !== null &&
            open !== programmaticStateRef.current
        ) {
            localStorage.setItem(getStorageKey(currentRoute), String(open));
            programmaticStateRef.current = open;
        }
    }, [open, currentRoute]);

    return (
        <Sidebar
            collapsible="icon"
            {...props}
        >
            <>
                <SidebarHeader>
                    <OrgSidebarHeader />
                    <Separator
                        orientation="horizontal"
                        className="h-6"
                    />
                </SidebarHeader>
                <SidebarContent className="flex flex-col">
                    {isIndexRoute || isLoading ? null : (
                        <>
                            <div className="flex flex-col">
                                {(mainItems.length > 0 || settingsItem) && (
                                    <NavMain
                                        items={[
                                            ...mainItems.map((item) => ({
                                                title: item.title,
                                                url: item.url as any,
                                                icon: item.icon as LucideIcon,
                                            })),
                                            ...(settingsItem
                                                ? [
                                                      {
                                                          title: settingsItem.title,
                                                          url: settingsItem.url as any,
                                                          icon: settingsItem.icon as LucideIcon,
                                                      },
                                                  ]
                                                : []),
                                        ]}
                                        showLabel={true}
                                        label="Organization"
                                        onLinkClick={handleLinkClick}
                                    />
                                )}
                                {memberItems.length > 0 && (
                                    <SidebarGroup>
                                        <SidebarGroupLabel>Organization Members</SidebarGroupLabel>
                                        <SidebarMenu>
                                            {memberItems.map((item) => {
                                                const Icon = item.icon as LucideIcon;
                                                return (
                                                    <SidebarMenuItem key={item.url}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            tooltip={item.title}
                                                        >
                                                            <Link
                                                                to={item.url as any}
                                                                onClick={handleLinkClick}
                                                            >
                                                                <Icon />
                                                                <span>{item.title}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                );
                                            })}
                                        </SidebarMenu>
                                    </SidebarGroup>
                                )}
                            </div>
                            <SidebarGroup className="mt-auto">
                                <SidebarGroupLabel>ClassClarus</SidebarGroupLabel>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Home"
                                        >
                                            <a
                                                href="https://www.classclarus.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={handleLinkClick}
                                            >
                                                <Home />
                                                <span>Home</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Blog"
                                        >
                                            <a
                                                href="https://blog.classclarus.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={handleLinkClick}
                                            >
                                                <BookOpen />
                                                <span>Blog</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Wiki"
                                        >
                                            <a
                                                href="https://wiki.classclarus.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={handleLinkClick}
                                            >
                                                <Book />
                                                <span>Wiki</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroup>
                        </>
                    )}
                </SidebarContent>
                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </>
        </Sidebar>
    );
}
