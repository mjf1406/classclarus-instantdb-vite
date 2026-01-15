/** @format */

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthContext } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    PlusIcon,
    Grid3x3Icon,
    ListIcon,
    Building2Icon,
    UserPlus,
} from "lucide-react";
import { OrgGrid } from "../-components/org-grid";
import { OrgLists } from "../-components/org-lists";
import { OrgNoOrgs } from "../-components/org-no-orgs";
import { CreateOrgDialog } from "../-components/create-org-dialog";

import { requireAuth } from "@/lib/auth-utils";

export const Route = createFileRoute("/organizations/_orgLayout/")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function OrganizationsPageSkeleton() {
    return (
        <div className="container mx-auto md:py-12 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-12 md:size-16 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 md:h-8 lg:h-9 w-48 md:w-64" />
                        <Skeleton className="h-4 md:h-5 w-40 md:w-52" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-10 w-32 md:w-44 rounded-md" />
                    <Skeleton className="h-10 w-20 md:w-24 rounded-md" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="space-y-4 p-6 border rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-12 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RouteComponent() {
    const {
        isLoading: authLoading,
        organizations,
        isLoading: orgLoading,
    } = useAuthContext();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const isLoading = authLoading || orgLoading;

    if (isLoading) {
        return <OrganizationsPageSkeleton />;
    }

    return (
        <div className="container mx-auto md:py-12 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2Icon className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            My Organizations
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Manage your organizations
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="icon-sm"
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid view"
                        >
                            <Grid3x3Icon />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="icon-sm"
                            onClick={() => setViewMode("list")}
                            aria-label="List view"
                        >
                            <ListIcon />
                        </Button>
                    </div>
                    <CreateOrgDialog>
                        <Button size="lg">
                            <PlusIcon />
                            <span className="sr-only">Create Organization</span>
                            <span className="hidden md:block">
                                Create Organization
                            </span>
                        </Button>
                    </CreateOrgDialog>
                    <Button
                        size="lg"
                        variant="outline"
                        asChild
                    >
                        <Link to="/join">
                            <UserPlus />
                            <span className="sr-only">Join</span>
                            <span className="hidden md:block">Join</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {organizations.length === 0 && !isLoading ? (
                <OrgNoOrgs />
            ) : viewMode === "grid" ? (
                <OrgGrid
                    organizations={organizations}
                    isLoading={isLoading}
                />
            ) : (
                <OrgLists
                    organizations={organizations}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}
