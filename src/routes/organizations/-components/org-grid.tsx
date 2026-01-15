/** @format */

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgCard } from "./org-card";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";

interface OrgGridProps {
    organizations: OrganizationWithRelations[];
    isLoading?: boolean;
}

function OrgCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Skeleton className="size-8 rounded" />
                        <div className="flex-1 min-w-0 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-5 w-24" />
            </CardContent>
        </Card>
    );
}

export function OrgGrid({ organizations, isLoading }: OrgGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <OrgCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (organizations.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
                <OrgCard key={org.id} organization={org} />
            ))}
        </div>
    );
}
