/** @format */

"use client";

import * as React from "react";
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
} from "lucide-react";
import { useParams } from "@tanstack/react-router";

import { NavMain } from "./org-main";
import { NavProjects } from "./org-projects";
import { NavUser } from "@/components/navigation/nav-user";
import { OrgSidebarHeader } from "./org-sidebar-header";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef } from "react";

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "Acme Inc",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: AudioWaveform,
            plan: "Startup",
        },
        {
            name: "Evil Corp.",
            logo: Command,
            plan: "Free",
        },
    ],
    navMain: [
        {
            title: "Playground",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "History",
                    url: "#",
                },
                {
                    title: "Starred",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Models",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },
            ],
        },
        {
            title: "Documentation",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: Frame,
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
};

const STORAGE_KEY_PREFIX = "org-sidebar-preference-";

function getStorageKey(route: string) {
    return `${STORAGE_KEY_PREFIX}${route}`;
}

export function OrgSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const params = useParams({ strict: false });
    const isIndexRoute = !params.orgId;
    const currentRoute = params.orgId || "index";
    const { open, setOpen } = useSidebar();
    const lastRouteRef = useRef<string>(currentRoute);
    const programmaticStateRef = useRef<boolean | null>(open);
    const isAdjustingRef = useRef(false);

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
                    {isIndexRoute ? null : <NavMain items={data.navMain} />}
                    {isIndexRoute ? null : (
                        <NavProjects projects={data.projects} />
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
