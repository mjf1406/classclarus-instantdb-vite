/** @format */

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Icon, TextLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function ClassSidebarHeader() {
    const { state, toggleSidebar } = useSidebar();
    const isExpanded = state === "expanded";

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-transparent! data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent! relative"
                    onClick={toggleSidebar}
                >
                    {/* Icon container with absolute positioning when expanded */}
                    <div
                        className={cn(
                            "bg-transparent text-sidebar-primary-foreground flex aspect-square shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-linear",
                            isExpanded ? "size-14 absolute left-2" : "size-8"
                        )}
                    >
                        <Icon
                            className={cn(
                                "transition-all duration-200 ease-linear",
                                isExpanded ? "size-6" : "size-4"
                            )}
                        />
                    </div>
                    {/* Text logo with left margin to account for absolute icon */}
                    <div
                        className={cn(
                            "flex flex-1 items-center min-w-0 transition-all duration-200 ease-linear mt-3",
                            isExpanded ? "ml-12" : "ml-0"
                        )}
                    >
                        <TextLogo
                            className={cn(
                                "w-auto max-w-full transition-all duration-200 ease-linear",
                                isExpanded ? "h-2.5" : "h-0 opacity-0"
                            )}
                        />
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
