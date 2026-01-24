/** @format */

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import {
    PlusIcon,
    Grid3x3Icon,
    ListIcon,
    BookOpen,
    ArchiveIcon,
    UserPlus,
} from "lucide-react";
import { ClassGrid } from "./-components/class-grid";
import { ClassList } from "./-components/class-list";
import { ClassNoClasses } from "@/routes/organizations/_orgLayout/$orgId/main/classes/-components/class-no-classes";
import { CreateClassDialog } from "@/routes/organizations/_orgLayout/$orgId/main/classes/-components/create-class-dialog";
import { useAllUserClasses } from "@/hooks/use-class-hooks";
import { LogIn } from "lucide-react";
import { CreateOrgDialog } from "@/routes/organizations/-components/create-org-dialog";
import { useAuthContext } from "@/components/auth/auth-provider";

export const Route = createFileRoute("/classes/_classesLayout/")({
    beforeLoad: ({ context, location }) => {
        requireAuth(context, location);
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { classes, isLoading } = useAllUserClasses();
    const { organizations } = useAuthContext();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Check if user is a member of any organization (owner, admin, or teacher)
    const isOrgMember = organizations.length > 0;

    // Separate active and archived classes
    const activeClasses = classes.filter(
        (c) => !c.archivedAt || c.archivedAt === null
    );
    const archivedClasses = classes.filter(
        (c) => c.archivedAt && c.archivedAt !== null
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            My Classes
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            All classes you're part of
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
                    {isOrgMember ? (
                        <>
                            <CreateClassDialog>
                                <Button size="lg">
                                    <PlusIcon />
                                    <span className="sr-only">Create Class</span>
                                    <span className="hidden md:block">
                                        Create Class
                                    </span>
                                </Button>
                            </CreateClassDialog>
                            <Button
                                size="lg"
                                variant="outline"
                                asChild
                            >
                                <Link to="/join">
                                    <UserPlus />
                                    <span className="sr-only">Join Organization</span>
                                    <span className="hidden md:block">
                                        Join Organization
                                    </span>
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                        >
                            <Link to="/join/class">
                                <LogIn />
                                <span className="sr-only">Join Class</span>
                                <span className="hidden md:block">
                                    Join Class
                                </span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Classes Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                        Active Classes
                        {activeClasses.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({activeClasses.length})
                            </span>
                        )}
                    </h2>
                </div>
                {activeClasses.length === 0 && !isLoading ? (
                    <ClassNoClasses
                        createClassButton={
                            isOrgMember ? (
                                <CreateClassDialog>
                                    <Button
                                        size="lg"
                                        className="w-full"
                                    >
                                        <PlusIcon />
                                        <span>Create Class</span>
                                    </Button>
                                </CreateClassDialog>
                            ) : undefined
                        }
                        createOrgButton={
                            isOrgMember ? (
                                <CreateOrgDialog>
                                    <Button
                                        size="lg"
                                        variant="ghost"
                                        className="w-full"
                                    >
                                        <PlusIcon />
                                        <span>Create Organization</span>
                                    </Button>
                                </CreateOrgDialog>
                            ) : undefined
                        }
                        joinClassButton={
                            !isOrgMember ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    asChild
                                    className="w-full"
                                >
                                    <Link to="/join/class">
                                        <LogIn />
                                        <span>Join Class</span>
                                    </Link>
                                </Button>
                            ) : undefined
                        }
                        joinOrgButton={
                            isOrgMember ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    asChild
                                    className="w-full"
                                >
                                    <Link to="/join/organization">
                                        <UserPlus />
                                        <span>Join Organization</span>
                                    </Link>
                                </Button>
                            ) : undefined
                        }
                    />
                ) : viewMode === "grid" ? (
                    <ClassGrid
                        classes={activeClasses}
                        isLoading={isLoading}
                    />
                ) : (
                    <ClassList
                        classes={activeClasses}
                        isLoading={isLoading}
                    />
                )}
            </div>

            {/* Archived Classes Section */}
            {archivedClasses.length > 0 || isLoading ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ArchiveIcon className="size-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">
                            Archived Classes
                            {archivedClasses.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({archivedClasses.length})
                                </span>
                            )}
                        </h2>
                    </div>
                    {archivedClasses.length === 0 && !isLoading ? (
                        <p className="text-sm text-muted-foreground">
                            No archived classes
                        </p>
                    ) : viewMode === "grid" ? (
                        <ClassGrid
                            classes={archivedClasses}
                            isLoading={isLoading}
                        />
                    ) : (
                        <ClassList
                            classes={archivedClasses}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
}
