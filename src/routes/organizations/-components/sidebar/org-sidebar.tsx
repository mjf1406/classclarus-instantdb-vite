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
import { OrgSwitcher } from "./org-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuthContext } from "@/components/auth/auth-provider";

// This is sample data.
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const params = useParams({ strict: false });
    const { state } = useSidebar();
    const { user: authUser } = useAuthContext();
    const isIndexRoute = !params.orgId;
    const isExpanded = state === "expanded";

    // Transform auth user data to match NavUser component's expected format
    const userData = {
        name:
            authUser?.firstName && authUser?.lastName
                ? `${authUser.firstName} ${authUser.lastName}`
                : authUser?.firstName ||
                  authUser?.lastName ||
                  authUser?.email ||
                  "User",
        email: authUser?.email || "",
        avatar: authUser?.avatarURL || authUser?.imageURL || "",
    };

    return (
        <Sidebar
            collapsible="icon"
            {...props}
        >
            <>
                <SidebarHeader>
                    {isIndexRoute ? null : <OrgSwitcher teams={data.teams} />}
                </SidebarHeader>
                <SidebarContent>
                    {isIndexRoute ? null : <NavMain items={data.navMain} />}
                    {isIndexRoute ? null : (
                        <NavProjects projects={data.projects} />
                    )}
                </SidebarContent>
                <SidebarFooter>
                    <NavUser user={userData} />
                </SidebarFooter>
                <SidebarRail />
            </>
        </Sidebar>
    );
}
