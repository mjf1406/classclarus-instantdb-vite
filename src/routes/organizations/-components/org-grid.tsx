/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2Icon, PlusIcon } from "lucide-react";
import { OrgCard } from "./org-card";
import { CreateOrgDialog } from "./create-org-dialog";

type Organization = InstaQLEntity<
    AppSchema,
    "organizations",
    {
        classes: {};
        owner: {};
        admins: {};
        orgTeachers: {};
        orgStudents: {};
        orgParents: {};
    }
>;

interface OrgGridProps {
    organizations: Organization[];
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
        return (
            <Card className="border-dashed">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                        <Building2Icon className="size-6 text-muted-foreground" />
                    </div>
                    <CardTitle>No organizations yet</CardTitle>
                    <CardDescription>
                        Create your first organization to get started managing classes and students.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <CreateOrgDialog>
                        <Button>
                            <PlusIcon />
                            Create Organization
                        </Button>
                    </CreateOrgDialog>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
                <OrgCard key={org.id} organization={org} />
            ))}
        </div>
    );
}
