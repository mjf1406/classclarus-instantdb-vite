/** @format */

"use client";

import * as React from "react";
import { useLocation } from "@tanstack/react-router";

import { NavMain } from "./user-main";
import { NavUser } from "@/components/navigation/nav-user";
import { UserSidebarHeader } from "./user-sidebar-header";
import { ClassClarusLinks } from "@/routes/classes/_classesLayout/-components/sidebar/classclarus-links";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Settings, BookOpen, Building2 } from "lucide-react";
import { isRouteActive } from "@/lib/utils";
import { useAuthContext } from "@/components/auth/auth-provider";

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();
    const { setOpenMobile, isMobile } = useSidebar();
    const { user, classIds, organizations } = useAuthContext();

    // Close sidebar on mobile when a link is clicked
    const handleLinkClick = React.useCallback(() => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }, [isMobile, setOpenMobile]);

    // Check if user is org owner/admin
    const isOrgOwnerOrAdmin = organizations.some(
        (org) =>
            org.owner?.id === user.id ||
            org.admins?.some((admin) => admin.id === user.id)
    );

    // Check if user is in classes
    const hasClasses = classIds.length > 0;

    const navigationItems = [
        {
            title: "Account",
            url: "/user/account",
            icon: User,
            isActive: isRouteActive(location.pathname, "/user/account"),
        },
        {
            title: "Billing",
            url: "/user/billing",
            icon: CreditCard,
            isActive: isRouteActive(location.pathname, "/user/billing"),
        },
        {
            title: "Settings",
            url: "/user/settings",
            icon: Settings,
            isActive: isRouteActive(location.pathname, "/user/settings"),
        },
    ];

    // Add conditional navigation items
    if (hasClasses) {
        navigationItems.push({
            title: "Classes",
            url: "/classes",
            icon: BookOpen,
            isActive: isRouteActive(location.pathname, "/classes"),
        });
    }

    if (isOrgOwnerOrAdmin) {
        navigationItems.push({
            title: "Organizations",
            url: "/organizations",
            icon: Building2,
            isActive: isRouteActive(location.pathname, "/organizations"),
        });
    }

    return (
        <Sidebar
            collapsible="icon"
            {...props}
        >
            <>
                <SidebarHeader>
                    <UserSidebarHeader />
                    <Separator
                        orientation="horizontal"
                        className="h-6"
                    />
                </SidebarHeader>
                <SidebarContent className="flex flex-col">
                    <div className="flex flex-col">
                        <NavMain
                            items={navigationItems}
                            onLinkClick={handleLinkClick}
                        />
                    </div>
                    <div className="mt-auto">
                        <ClassClarusLinks onLinkClick={handleLinkClick} />
                    </div>
                </SidebarContent>
                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </>
        </Sidebar>
    );
}
