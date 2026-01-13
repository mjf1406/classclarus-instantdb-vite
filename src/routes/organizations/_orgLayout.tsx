/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
import LoginPage from "@/components/auth/login-page";
import LoadingPage from "@/components/auth/loading-page";
import {
    createFileRoute,
    Link,
    Outlet,
    useParams,
} from "@tanstack/react-router";
import { Home } from "lucide-react";
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
import { OrgSidebar } from "./-components/sidebar/org-sidebar";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RenderLogo } from "@/components/icons/render-logo";

export const Route = createFileRoute("/organizations/_orgLayout")({
    component: RouteComponent,
});

function RouteComponent() {
    const { user, isLoading: authLoading } = useAuthContext();
    const params = useParams({ strict: false });
    const isIndexRoute = !params.orgId;
    const isMobile = useIsMobile();
    const { organization, isLoading: orgLoading } = useOrganizationById(
        params.orgId
    );

    if (!user || !user.id) {
        return <LoginPage />;
    }
    if (authLoading) {
        return <LoadingPage />;
    }
    // This is where the sidebar layout when viewing a single organization goes
    return (
        <SidebarProvider defaultOpen={!isIndexRoute}>
            <OrgSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <>
                            <SidebarTrigger
                                className={cn(
                                    "-ml-1",
                                    isIndexRoute && !isMobile && "invisible"
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
                                            <Link to="/">
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
                                            <Link to="/organizations">
                                                Organizations
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {organization && (
                                        <>
                                            <BreadcrumbSeparator className="" />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>
                                                    {orgLoading ? (
                                                        "Loading..."
                                                    ) : (
                                                        <span className="truncate max-w-[100px] inline-block">
                                                            {organization.name}
                                                        </span>
                                                    )}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </>
                                    )}
                                </>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {organization?.name && (
                        <div className="flex items-center gap-2 -mb-2">
                            <RenderLogo
                                icon={organization?.icon}
                                size="size-12"
                                rounded="full"
                                alt={organization?.name}
                            />
                            {organization.name.length > 10 ? (
                                <span className="text-2xl w-full font-medium mx-auto truncate">
                                    {organization.name}
                                </span>
                            ) : (
                                <span className="text-2xl w-full font-medium mx-auto">
                                    {organization.name}
                                </span>
                            )}
                        </div>
                    )}
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
