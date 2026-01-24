/** @format */

import {
    createFileRoute,
    Link,
    Outlet,
    useLocation,
} from "@tanstack/react-router";
import { Home } from "lucide-react";
import React from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserSidebar } from "./-components/sidebar/user-sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { requireAuth } from "@/lib/auth-utils";

export const Route = createFileRoute("/user/_userLayout")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function RouteComponent() {
    const location = useLocation();
    const isMobile = useIsMobile();

    // Build breadcrumb segments based on current route
    const getBreadcrumbSegments = () => {
        const pathname = location.pathname;
        const segments: Array<{ label: string; href?: string }> = [];

        // Parse the path to determine breadcrumb segments
        // Example: /user/account should show: Home > User > Account

        const pathParts = pathname.split("/").filter(Boolean);
        const userIndex = pathParts.indexOf("user");

        if (userIndex === -1) {
            return segments;
        }

        // Check if we're in a subroute
        if (pathParts.length > userIndex + 1) {
            const subroute = pathParts[userIndex + 1];
            const subrouteLabels: Record<string, string> = {
                account: "Account",
                billing: "Billing",
                settings: "Settings",
            };

            if (subrouteLabels[subroute]) {
                segments.push({
                    label: subrouteLabels[subroute],
                });
            }
        }

        return segments;
    };

    const breadcrumbSegments = getBreadcrumbSegments();

    return (
        <SidebarProvider defaultOpen={true}>
            <UserSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <>
                            <SidebarTrigger
                                className={cn(
                                    "-ml-1",
                                    !isMobile && "invisible"
                                )}
                            />
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-6"
                            />
                        </>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link
                                                to="/"
                                                search={{ redirect: undefined }}
                                            >
                                                <Home className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Home
                                                </span>
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem className="">
                                        <BreadcrumbLink asChild>
                                            <Link to="/user/account">
                                                User
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {breadcrumbSegments.map(
                                        (segment, index) => (
                                            <React.Fragment key={index}>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>
                                                    {segment.href &&
                                                    index <
                                                        breadcrumbSegments.length -
                                                            1 ? (
                                                        <BreadcrumbLink asChild>
                                                            <Link
                                                                to={
                                                                    segment.href as any
                                                                }
                                                            >
                                                                {segment.label}
                                                            </Link>
                                                        </BreadcrumbLink>
                                                    ) : (
                                                        <BreadcrumbPage>
                                                            {segment.label}
                                                        </BreadcrumbPage>
                                                    )}
                                                </BreadcrumbItem>
                                            </React.Fragment>
                                        )
                                    )}
                                </>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
