/** @format */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useAuthContext } from "@/components/auth/auth-provider";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { PlusIcon, Grid3x3Icon, ListIcon } from "lucide-react";
import { OrgGrid } from "../-components/org-grid";
import { OrgLists } from "../-components/org-lists";
import { CreateOrgDialog } from "../-components/create-org-dialog";
import LoginPage from "@/components/auth/login-page";

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

export const Route = createFileRoute("/organizations/_orgLayout/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { user, isLoading: authLoading } = useAuthContext();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Query organizations where user has any role
    const hasValidUser = user?.id && user.id.trim() !== "";

    const query = hasValidUser
        ? {
              organizations: {
                  $: {
                      where: {
                          or: [
                              { "owner.id": user.id },
                              { "admins.id": user.id },
                              { "orgStudents.id": user.id },
                              { "orgTeachers.id": user.id },
                              { "orgParents.id": user.id },
                          ],
                      },
                  },
                  classes: {},
                  owner: {},
                  admins: {},
                  orgStudents: {},
                  orgTeachers: {},
                  orgParents: {},
              },
          }
        : { organizations: {} };

    // Type assertion needed due to TypeScript limitations with nested field references in queries
    const { data, isLoading: dataLoading } = db.useQuery(
        query as unknown as Parameters<typeof db.useQuery>[0]
    );

    const organizations: Organization[] =
        ((data as any)?.organizations as Organization[] | undefined) || [];
    const isLoading = authLoading || dataLoading;

    if (!user || !user.id) {
        return <LoginPage />;
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Organizations</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your organizations
                    </p>
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
                        <Button>
                            <PlusIcon />
                            Create Organization
                        </Button>
                    </CreateOrgDialog>
                </div>
            </div>

            {viewMode === "grid" ? (
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
