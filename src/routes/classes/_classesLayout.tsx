/** @format */

import { useAuthContext } from "@/components/auth/auth-provider";
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
import { ClassSidebar } from "@/routes/classes/_classesLayout/-components/sidebar/class-sidebar";
import { useClassById } from "@/hooks/use-class-hooks";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RenderLogo } from "@/components/icons/render-logo";
import { useClassRole } from "@/hooks/use-class-role";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgRole } from "@/hooks/use-org-role";
import {
    OwnerBadge,
    AdminBadge,
    TeacherBadge,
    AssistantTeacherBadge,
    StudentBadge,
    GuardianBadge,
} from "@/components/icons/role-icons";
import { requireAuth, requireClassAccess } from "@/lib/auth-utils";
import { LeaveClassDialog } from "@/components/classes/leave-class-dialog";

export const Route = createFileRoute("/classes/_classesLayout")({
    beforeLoad: ({ context, location, params }) => {
        // First ensure user is authenticated
        requireAuth(context, location);

        // If there's a classId param, check class access
        // (The index route doesn't have a classId, so we skip the check)
        const classId = (params as { classId?: string }).classId;
        if (classId) {
            requireClassAccess(classId, context, location);
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { organizations, user } = useAuthContext();
    const params = useParams({ strict: false });
    const location = useLocation();
    const isIndexRoute = !params.classId;
    const isMobile = useIsMobile();
    const { class: classEntity, isLoading: classLoading } = useClassById(
        params.classId
    );
    const roleInfo = useClassRole(classEntity);
    
    // Get organization and check if user is org owner/admin
    // For class detail route: use the class's organization
    // For index route: use first organization where user is owner/admin
    const orgId = classEntity?.organization?.id;
    const { organization: classOrg } = useOrganizationById(orgId);
    const classOrgRoleInfo = useOrgRole(classOrg);
    
    // For index route, find first org where user is owner/admin
    // Check directly without using hook in callback
    const userId = user?.id;
    const indexOrg = isIndexRoute
        ? organizations.find((org) => {
              if (!userId) return false;
              const isOwner = org.owner?.id === userId;
              const isAdmin = org.admins?.some((admin) => admin.id === userId);
              return isOwner || isAdmin;
          }) || null
        : null;
    
    // Determine which organization to show and if user can view it
    const organization = isIndexRoute ? indexOrg : classOrg;
    const orgRoleInfo = isIndexRoute
        ? {
              isOwner: !!(userId && indexOrg?.owner?.id === userId),
              isAdmin: !!(
                  userId &&
                  indexOrg?.owner?.id !== userId &&
                  indexOrg?.admins?.some((admin) => admin.id === userId)
              ),
          }
        : classOrgRoleInfo;
    const canViewOrg = orgRoleInfo.isOwner || orgRoleInfo.isAdmin;

    // Build breadcrumb segments based on current route
    const getBreadcrumbSegments = () => {
        if (!params.classId) {
            return [];
        }

        const pathname = location.pathname;
        const segments: Array<{ label: string; href?: string }> = [];

        // Parse the path to determine breadcrumb segments
        // Example: /classes/123/main/dashboard
        // Should show: Home > Classes > [Class Name] > Dashboard

        const pathParts = pathname.split("/").filter(Boolean);
        const classIndex = pathParts.indexOf("classes");

        if (classIndex === -1) {
            return segments;
        }

        // Check if we're in a subroute
        const classIdIndex = classIndex + 1;
        if (pathParts.length > classIdIndex + 1) {
            const subroute = pathParts[classIdIndex + 1];

            if (subroute === "main") {
                // Check for specific main subroutes
                if (pathParts.length > classIdIndex + 2) {
                    const mainSubroute = pathParts[classIdIndex + 2];
                    const mainSubrouteLabels: Record<string, string> = {
                        dashboard: "Dashboard",
                        settings: "Settings",
                    };

                    if (mainSubrouteLabels[mainSubroute]) {
                        // Just show the specific subroute, skip "Main"
                        segments.push({
                            label: mainSubrouteLabels[mainSubroute],
                        });
                    }
                }
            } else if (subroute === "members") {
                // Check if we're at the members index route
                if (pathParts.length === classIdIndex + 2) {
                    // At /classes/$classId/members
                    segments.push({
                        label: "All Members",
                    });
                } else if (pathParts.length > classIdIndex + 2) {
                    // Check for specific member subroutes
                    const memberSubroute = pathParts[classIdIndex + 2];
                    const memberSubrouteLabels: Record<string, string> = {
                        admins: "Admins",
                        teachers: "Teachers",
                        "assistant-teachers": "Asst Teachers",
                        students: "Students",
                        guardians: "Guardians",
                        invite: "Invite Members",
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

    // This is where the sidebar layout when viewing a single class goes
    return (
        <SidebarProvider defaultOpen={!isIndexRoute}>
            <ClassSidebar />
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
                                    {canViewOrg && organization && (
                                        <>
                                            <BreadcrumbItem>
                                                <BreadcrumbLink asChild>
                                                    <Link to="/organizations">
                                                        Orgs
                                                    </Link>
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbLink asChild>
                                                    <Link
                                                        to={`/organizations/${organization.id}` as any}
                                                        className="flex items-center"
                                                    >
                                                        <span className="block max-w-[60px] truncate lg:max-w-none lg:overflow-visible lg:whitespace-normal">
                                                            {organization.name}
                                                        </span>
                                                    </Link>
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                        </>
                                    )}
                                    <BreadcrumbItem className="">
                                        <BreadcrumbLink asChild>
                                            <Link to="/classes">Classes</Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {classEntity && (
                                        <>
                                            <BreadcrumbSeparator className="" />
                                            <BreadcrumbItem>
                                                <BreadcrumbLink asChild>
                                                    <Link
                                                        to={
                                                            `/classes/${params.classId}` as any
                                                        }
                                                        className="flex items-center"
                                                    >
                                                        {classLoading ? (
                                                            "Loading..."
                                                        ) : (
                                                            <span className="block max-w-[60px] truncate lg:max-w-none lg:overflow-visible lg:whitespace-normal">
                                                                {
                                                                    classEntity.name
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
                                        classEntity && (
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
                    {classEntity?.name && (
                        <div className="flex items-center justify-between gap-2 -mb-2">
                            <div className="flex items-center gap-2">
                                <RenderLogo
                                    icon={classEntity?.icon}
                                    size="size-12"
                                    rounded="full"
                                    alt={classEntity?.name}
                                />
                                <div className="flex items-center gap-2">
                                    {classEntity.name.length > 10 ? (
                                        <span className="text-2xl font-medium truncate">
                                            {classEntity.name}
                                        </span>
                                    ) : (
                                        <span className="text-2xl font-medium">
                                            {classEntity.name}
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
                                                  : roleInfo.isGuardian
                                                    ? GuardianBadge
                                                    : roleInfo.isStudent
                                                      ? StudentBadge
                                                      : null;
                                        return RoleBadge ? <RoleBadge /> : null;
                                    })()}
                                </div>
                            </div>
                            {!roleInfo.isOwner && classEntity && (
                                <LeaveClassDialog classEntity={classEntity} />
                            )}
                        </div>
                    )}
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
