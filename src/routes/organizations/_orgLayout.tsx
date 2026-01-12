/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
import LoginPage from "@/components/auth/login-page";
import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
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

export const Route = createFileRoute("/organizations/_orgLayout")({
    component: RouteComponent,
});

function RouteComponent() {
    const { user, isLoading: authLoading } = useAuthContext();
    const params = useParams({ strict: false });
    const isIndexRoute = !params.orgId;

    if (!user || !user.id) {
        return <LoginPage />;
    }
    if (authLoading) {
        return <Loader2 className="h-16 w-16 animate-spin text-foreground" />;
    }
    // This is where the sidebar layout when viewing a single organization goes
    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        {isIndexRoute ? (
                            <div className="w-9" />
                        ) : (
                            <>
                                <SidebarTrigger className="-ml-1" />
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 data-[orientation=vertical]:h-4"
                                />
                            </>
                        )}
                        <Breadcrumb>
                            <BreadcrumbList>
                                {isIndexRoute ? (
                                    <>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink asChild>
                                                <Link to="/">Home</Link>
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>
                                                Organizations
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                ) : (
                                    <>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href="#">
                                                Organizations
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>
                                                Data Fetching
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                )}
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
