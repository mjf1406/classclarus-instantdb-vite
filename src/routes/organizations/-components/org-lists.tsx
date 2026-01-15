/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgRow } from "./org-row";
import type { OrganizationWithRelations } from "@/hooks/use-organization-hooks";

interface OrgListsProps {
    organizations: OrganizationWithRelations[];
    isLoading?: boolean;
}

function OrgRowSkeleton() {
    return (
        <Card>
            <CardContent className="py-3">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-8 rounded" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function OrgLists({ organizations, isLoading }: OrgListsProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <OrgRowSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (organizations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {organizations.map((org) => (
                <OrgRow key={org.id} organization={org} />
            ))}
        </div>
    );
}
