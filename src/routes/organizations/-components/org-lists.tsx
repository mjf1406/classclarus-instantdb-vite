/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2Icon, PlusIcon } from "lucide-react";
import { OrgRow } from "./org-row";
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

interface OrgListsProps {
    organizations: Organization[];
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
        <div className="space-y-3">
            {organizations.map((org) => (
                <OrgRow key={org.id} organization={org} />
            ))}
        </div>
    );
}
