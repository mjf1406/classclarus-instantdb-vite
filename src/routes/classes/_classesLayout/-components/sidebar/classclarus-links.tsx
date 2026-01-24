/** @format */

"use client";

import {
    Home,
    BookOpen,
    HelpCircle,
    Shield,
    FileText,
    Cookie,
} from "lucide-react";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

interface ClassClarusLinksProps {
    onLinkClick?: () => void;
}

export function ClassClarusLinks({ onLinkClick }: ClassClarusLinksProps) {
    return (
        <SidebarGroup>
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
                            onClick={onLinkClick}
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
                            onClick={onLinkClick}
                        >
                            <BookOpen />
                            <span>Blog</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip="Help Center"
                    >
                        <a
                            href="https://wiki.classclarus.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLinkClick}
                        >
                            <HelpCircle />
                            <span>Help Center</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip="Privacy Policy"
                    >
                        <a
                            href="https://www.classclarus.com/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLinkClick}
                        >
                            <Shield />
                            <span>Privacy Policy</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip="Terms of Service"
                    >
                        <a
                            href="https://www.classclarus.com/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLinkClick}
                        >
                            <FileText />
                            <span>Terms and Conditions</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip="Cookie Policy"
                    >
                        <a
                            href="https://www.classclarus.com/cookie-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLinkClick}
                        >
                            <Cookie />
                            <span>Cookie Policy</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}
