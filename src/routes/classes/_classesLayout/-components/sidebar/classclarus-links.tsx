/** @format */

"use client";

import {
    Home,
    BookOpen,
    HelpCircle,
    Shield,
    FileText,
    Lock,
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
                            href="https://www.classclarus.com/terms-of-service"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLinkClick}
                        >
                            <FileText />
                            <span>Terms of Service</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip="Security"
                    >
                        <a
                            href="https://www.classclarus.com/security"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLinkClick}
                        >
                            <Lock />
                            <span>Security</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip="Privacy"
                    >
                        <a
                            href="https://www.classclarus.com/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLinkClick}
                        >
                            <Shield />
                            <span>Privacy</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}
