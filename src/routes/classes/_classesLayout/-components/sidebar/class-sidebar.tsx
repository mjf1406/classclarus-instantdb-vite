/** @format */

"use client";

import * as React from "react";
import { useParams, Link, useLocation } from "@tanstack/react-router";

import { NavMain } from "./class-main";
import { NavUser } from "@/components/navigation/nav-user";
import { ClassSidebarHeader } from "./class-sidebar-header";
import { ClassClarusLinks } from "./classclarus-links";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRoleBasedNavigation } from "../navigation/role-based-navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronUp, ChevronDown, BookOpenCheck, Users, Dice6, Award } from "lucide-react";
import { isRouteActive } from "@/lib/utils";
import type { NavigationItem } from "../navigation/types";

const STORAGE_KEY_PREFIX = "class-sidebar-preference-";

function getStorageKey(route: string) {
    return `${STORAGE_KEY_PREFIX}${route}`;
}

interface ExpandableSectionProps {
    title: string;
    icon: LucideIcon;
    items: NavigationItem[];
    defaultOpen?: boolean;
    onLinkClick?: () => void;
    sortItems?: (items: NavigationItem[]) => NavigationItem[];
}

function ExpandableSection({
    title,
    icon: Icon,
    items,
    defaultOpen = false,
    onLinkClick,
    sortItems,
}: ExpandableSectionProps) {
    const { state } = useSidebar();
    const location = useLocation();
    const isCollapsed = state === "collapsed";
    const [isHovered, setIsHovered] = React.useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });

    const sortedItems = React.useMemo(
        () => (sortItems ? sortItems([...items]) : items),
        [items, sortItems]
    );

    const updateMenuPosition = React.useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.top,
                left: rect.right + 8,
            });
        }
    }, []);

    const handleMouseEnter = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        updateMenuPosition();
        setIsHovered(true);
    }, [updateMenuPosition]);

    const handleMouseLeave = React.useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 150);
    }, []);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (isHovered && triggerRef.current) {
            updateMenuPosition();
        }
    }, [isHovered, updateMenuPosition]);

    if (isCollapsed) {
        const menuContent = isHovered ? (
            <div
                ref={menuRef}
                className="fixed z-50 w-56 bg-popover text-popover-foreground rounded-lg shadow-lg ring-1 ring-foreground/10 p-1"
                style={{
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {sortedItems.map((item) => {
                    const ItemIcon = item.icon as LucideIcon;
                    const isActive = isRouteActive(
                        location.pathname,
                        item.url
                    );
                    return (
                        <Link
                            key={item.url}
                            to={item.url as any}
                            onClick={() => {
                                setIsHovered(false);
                                onLinkClick?.();
                            }}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive && "bg-accent text-accent-foreground"
                            )}
                        >
                            <ItemIcon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </div>
        ) : null;

        return (
            <>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <SidebarMenuButton
                                ref={triggerRef}
                                tooltip={title}
                            >
                                <Icon />
                                <span>{title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
                {typeof document !== "undefined" && createPortal(menuContent, document.body)}
            </>
        );
    }

    return (
        <SidebarGroup>
            <SidebarMenu>
                <Collapsible
                    defaultOpen={defaultOpen}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="sticky top-0 z-10 bg-sidebar">
                                {title}
                                <ChevronDown className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                                <ChevronUp className="ml-auto group-data-[state=open]/collapsible:hidden" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {sortedItems.map((item) => {
                                    const ItemIcon = item.icon as LucideIcon;
                                    const isActive = isRouteActive(
                                        location.pathname,
                                        item.url
                                    );
                                    return (
                                        <SidebarMenuSubItem key={item.url}>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isActive}
                                                className="[&>svg]:opacity-100 [&>svg]:visible [&>svg]:text-foreground"
                                            >
                                                <Link
                                                    to={item.url as any}
                                                    onClick={onLinkClick}
                                                >
                                                    <ItemIcon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    );
                                })}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function ClassSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const params = useParams({ strict: false });
    const location = useLocation();
    const isIndexRoute = !params.classId;
    const currentRoute = params.classId || "index";
    const { open, setOpen, setOpenMobile, isMobile } = useSidebar();
    const lastRouteRef = useRef<string>(currentRoute);
    const programmaticStateRef = useRef<boolean | null>(open);
    const isAdjustingRef = useRef(false);
    const {
        mainItems,
        memberItems,
        settingsItem,
        classManagementItems,
        randomItems,
        behaviorItems,
        isLoading,
    } = useRoleBasedNavigation();

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
                    <ClassSidebarHeader />
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
                                            ...mainItems
                                                .map((item) => ({
                                                    title: item.title,
                                                    url: item.url as any,
                                                    icon: item.icon as LucideIcon,
                                                    isActive: isRouteActive(
                                                        location.pathname,
                                                        item.url
                                                    ),
                                                }))
                                                .sort((a, b) => {
                                                    // Keep "Home" at the top
                                                    if (a.title === "Home") return -1;
                                                    if (b.title === "Home") return 1;
                                                    return a.title.localeCompare(b.title);
                                                }),
                                            ...(settingsItem
                                                ? [
                                                      {
                                                          title: settingsItem.title,
                                                          url: settingsItem.url as any,
                                                          icon: settingsItem.icon as LucideIcon,
                                                          isActive:
                                                              isRouteActive(
                                                                  location.pathname,
                                                                  settingsItem.url
                                                              ),
                                                      },
                                                  ]
                                                : []),
                                        ].sort((a, b) => {
                                            // Keep "Home" at the top
                                            if (a.title === "Home") return -1;
                                            if (b.title === "Home") return 1;
                                            return a.title.localeCompare(b.title);
                                        })}
                                        showLabel={false}
                                        onLinkClick={handleLinkClick}
                                    />
                                )}
                                {behaviorItems &&
                                    behaviorItems.length > 0 && (
                                        <ExpandableSection
                                            title="Class Behavior"
                                            icon={Award}
                                            items={behaviorItems}
                                            defaultOpen={true}
                                            onLinkClick={handleLinkClick}
                                            sortItems={(items) =>
                                                items.sort((a, b) =>
                                                    a.title.localeCompare(b.title)
                                                )
                                            }
                                        />
                                    )}
                                {classManagementItems &&
                                    classManagementItems.length > 0 && (
                                        <ExpandableSection
                                            title="Class Management"
                                            icon={BookOpenCheck}
                                            items={classManagementItems}
                                            defaultOpen={true}
                                            onLinkClick={handleLinkClick}
                                            sortItems={(items) =>
                                                items.sort((a, b) =>
                                                    a.title.localeCompare(b.title)
                                                )
                                            }
                                        />
                                    )}
                                {memberItems.length > 0 && (
                                    <ExpandableSection
                                        title="Class Members"
                                        icon={Users}
                                        items={memberItems}
                                        defaultOpen={false}
                                        onLinkClick={handleLinkClick}
                                        sortItems={(items) => {
                                            // Custom order: invite, all, admin, teacher, assistant teacher, guardian, students
                                            const order = [
                                                "Invite Members",
                                                "All Members",
                                                "Admins",
                                                "Teachers",
                                                "Assistant Teachers",
                                                "Guardians",
                                                "Students",
                                            ];
                                            return items.sort((a, b) => {
                                                const indexA = order.indexOf(a.title);
                                                const indexB = order.indexOf(b.title);
                                                if (indexA === -1 && indexB === -1) {
                                                    return a.title.localeCompare(b.title);
                                                }
                                                if (indexA === -1) return 1;
                                                if (indexB === -1) return -1;
                                                return indexA - indexB;
                                            });
                                        }}
                                    />
                                )}
                                {randomItems && randomItems.length > 0 && (
                                    <ExpandableSection
                                        title="Random Tools"
                                        icon={Dice6}
                                        items={randomItems}
                                        defaultOpen={false}
                                        onLinkClick={handleLinkClick}
                                        sortItems={(items) =>
                                            items.sort((a, b) =>
                                                a.title.localeCompare(b.title)
                                            )
                                        }
                                    />
                                )}
                            </div>
                            <div className="mt-auto">
                                <ClassClarusLinks onLinkClick={handleLinkClick} />
                            </div>
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
