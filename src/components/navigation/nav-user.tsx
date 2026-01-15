/** @format */

"use client";

import {
    BadgeCheck,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Settings,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";
import { useAuthContext } from "../auth/auth-provider";
import { db } from "@/lib/db/db";

export function NavUser() {
    const { isMobile } = useSidebar();
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const initials =
        (user.firstName?.charAt(0) || "") + (user.lastName?.charAt(0) || "") ||
        "GU";

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={
                                        user.avatarURL ||
                                        user.imageURL ||
                                        undefined
                                    }
                                    alt={initials || ""}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {user.firstName || "Guest"}{" "}
                                    {user.lastName || "User"}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.plan || "Free"}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={
                                            user.avatarURL ||
                                            user.imageURL ||
                                            undefined
                                        }
                                        alt={initials || ""}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {user.firstName || "Guest"}{" "}
                                        {user.lastName || "User"}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user.plan || "Free"}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <div className="px-2 py-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        Theme
                                    </span>
                                    <ThemeSwitcher />
                                </div>
                            </div>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    to="/user/profile"
                                    className="text-foreground! hover:text-background!"
                                >
                                    <BadgeCheck />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    to="/user/billing"
                                    className="text-foreground! hover:text-background!"
                                >
                                    <CreditCard />
                                    Billing
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    to="/user/settings"
                                    className="text-foreground! hover:text-background!"
                                >
                                    <Settings />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                db.auth.signOut();
                                navigate({ to: "/", search: { redirect: undefined } });
                            }}
                        >
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
