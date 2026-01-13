/** @format */

"use client";

import * as React from "react";
import { Home, LayoutDashboard, UserPlus, BookOpen, Users } from "lucide-react";
import { useParams, Link } from "@tanstack/react-router";

import { NavMain } from "./org-main";
import { NavUser } from "@/components/navigation/nav-user";
import { OrgSidebarHeader } from "./org-sidebar-header";
import {
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    ParentIcon,
    StudentIcon,
} from "@/components/icons/role-icons";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef } from "react";

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
                <SidebarContent>
                    {isIndexRoute ? null : (
                        <>
                            <NavMain
                                items={[
                                    {
                                        title: "Home",
                                        url: `/organizations/${params.orgId}` as any,
                                        icon: Home,
                                    },
                                    {
                                        title: "Dashboard",
                                        url: `/organizations/${params.orgId}/main/dashboard` as any,
                                        icon: LayoutDashboard,
                                    },
                                    {
                                        title: "Join Org Code",
                                        url: `/organizations/${params.orgId}/main/join-org-code` as any,
                                        icon: UserPlus,
                                    },
                                    {
                                        title: "Classes",
                                        url: `/organizations/${params.orgId}/main/classes` as any,
                                        icon: BookOpen,
                                    },
                                ]}
                                showLabel={false}
                                onLinkClick={handleLinkClick}
                            />
                            <SidebarGroup>
                                <SidebarGroupLabel>Members</SidebarGroupLabel>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="All"
                                        >
                                            <Link
                                                to={
                                                    `/organizations/${params.orgId}/members` as any
                                                }
                                                onClick={handleLinkClick}
                                            >
                                                <Users />
                                                <span>All</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Admins"
                                        >
                                            <Link
                                                to={
                                                    `/organizations/${params.orgId}/members/admins` as any
                                                }
                                                onClick={handleLinkClick}
                                            >
                                                <AdminIcon />
                                                <span>Admins</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Teachers"
                                        >
                                            <Link
                                                to={
                                                    `/organizations/${params.orgId}/members/teachers` as any
                                                }
                                                onClick={handleLinkClick}
                                            >
                                                <TeacherIcon />
                                                <span>Teachers</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Assistant Teachers"
                                        >
                                            <Link
                                                to={
                                                    `/organizations/${params.orgId}/members/assistant-teachers` as any
                                                }
                                                onClick={handleLinkClick}
                                            >
                                                <AssistantTeacherIcon />
                                                <span>Assistant Teachers</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Parents"
                                        >
                                            <Link
                                                to={
                                                    `/organizations/${params.orgId}/members/parents` as any
                                                }
                                                onClick={handleLinkClick}
                                            >
                                                <ParentIcon />
                                                <span>Parents</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip="Students"
                                        >
                                            <Link
                                                to={
                                                    `/organizations/${params.orgId}/members/students` as any
                                                }
                                                onClick={handleLinkClick}
                                            >
                                                <StudentIcon />
                                                <span>Students</span>
                                            </Link>
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
                <SidebarRail />
            </>
        </Sidebar>
    );
}
