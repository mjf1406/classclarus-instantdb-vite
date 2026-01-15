/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
import LoadingPage from "@/components/loading/loading-page";
import {
    createFileRoute,
    Link,
    Outlet,
    useParams,
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
import { OrgSidebar } from "./-components/sidebar/org-sidebar";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RenderLogo } from "@/components/icons/render-logo";
import { useOrgRole } from "./-components/navigation/use-org-role";
import {
    OwnerBadge,
    AdminBadge,
    TeacherBadge,
    AssistantTeacherBadge,
    StudentBadge,
    ParentBadge,
} from "@/components/icons/role-icons";

export const Route = createFileRoute("/organizations/_orgLayout")({
    component: RouteComponent,
});

function RouteComponent() {
    const { isLoading: authLoading } = useAuthContext();
    const params = useParams({ strict: false });
    const location = useLocation();
    const isIndexRoute = !params.orgId;
    const isMobile = useIsMobile();
    const { organization, isLoading: orgLoading } = useOrganizationById(
        params.orgId
    );
    const roleInfo = useOrgRole(organization);

    // Build breadcrumb segments based on current route
    const getBreadcrumbSegments = () => {
        if (!params.orgId) {
            return [];
        }

        const pathname = location.pathname;
        const segments: Array<{ label: string; href?: string }> = [];

        // Parse the path to determine breadcrumb segments
        // Example: /organizations/123/main/dashboard
        // Should show: Home > Organizations > [Org Name] > Main > Dashboard

        const pathParts = pathname.split("/").filter(Boolean);
        const orgIndex = pathParts.indexOf("organizations");

        if (orgIndex === -1) {
            return segments;
        }

        // Check if we're in a subroute
        const orgIdIndex = orgIndex + 1;
        if (pathParts.length > orgIdIndex + 1) {
            const subroute = pathParts[orgIdIndex + 1];

            if (subroute === "main") {
                // Check for specific main subroutes
                if (pathParts.length > orgIdIndex + 2) {
                    const mainSubroute = pathParts[orgIdIndex + 2];
                    const mainSubrouteLabels: Record<string, string> = {
                        dashboard: "Dashboard",
                        classes: "Classes",
                        "join-org-code": "Join Org Code",
                    };

                    if (mainSubrouteLabels[mainSubroute]) {
                        // Just show the specific subroute, skip "Main"
                        segments.push({
                            label: mainSubrouteLabels[mainSubroute],
                        });
                    }
                }
            } else if (subroute === "members") {
                // Check for specific member subroutes
                if (pathParts.length > orgIdIndex + 2) {
                    const memberSubroute = pathParts[orgIdIndex + 2];
                    const memberSubrouteLabels: Record<string, string> = {
                        admins: "Admins",
                        teachers: "Teachers",
                        "assistant-teachers": "Asst Teachers",
                        parents: "Parents",
                        students: "Students",
                    };

                    if (memberSubrouteLabels[memberSubroute]) {
                        // Just show the specific subroute, skip "Members"
                        segments.push({
                            label: memberSubrouteLabels[memberSubroute],
                        });
                    }
                }
            }
        }

        return segments;
    };

    const breadcrumbSegments = getBreadcrumbSegments();

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
                                                <BreadcrumbLink asChild>
                                                    <Link
                                                        to={
                                                            `/organizations/${params.orgId}` as any
                                                        }
                                                    >
                                                        {orgLoading ? (
                                                            "Loading..."
                                                        ) : (
                                                            <span className="inline-block mt-1 md:mt-0 max-w-[100px] truncate lg:max-w-none lg:overflow-visible lg:whitespace-normal">
                                                                {
                                                                    organization.name
                                                                }
                                                            </span>
                                                        )}
                                                    </Link>
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                        </>
                                    )}
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
                                    {breadcrumbSegments.length === 0 &&
                                        organization && (
                                            <>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>
                                                    <BreadcrumbPage>
                                                        Home
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
                            <div className="flex items-center gap-2">
                                {organization.name.length > 10 ? (
                                    <span className="text-2xl font-medium truncate">
                                        {organization.name}
                                    </span>
                                ) : (
                                    <span className="text-2xl font-medium">
                                        {organization.name}
                                    </span>
                                )}
                                {(() => {
                                    const RoleBadge = roleInfo.isOwner
                                        ? OwnerBadge
                                        : roleInfo.isAdmin
                                          ? AdminBadge
                                          : roleInfo.isTeacher
                                            ? TeacherBadge
                                            : roleInfo.isAssistantTeacher
                                              ? AssistantTeacherBadge
                                              : roleInfo.isStudent
                                                ? StudentBadge
                                                : roleInfo.isParent
                                                  ? ParentBadge
                                                  : null;
                                    return RoleBadge ? <RoleBadge /> : null;
                                })()}
                            </div>
                        </div>
                    )}
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
