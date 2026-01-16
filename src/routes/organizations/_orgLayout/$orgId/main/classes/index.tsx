/** @format */

import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
    PlusIcon,
    Grid3x3Icon,
    ListIcon,
    BookOpen,
    ArchiveIcon,
} from "lucide-react";
import { ClassGrid } from "./-components/class-grid";
import { ClassList } from "./-components/class-list";
import { ClassNoClasses } from "./-components/class-no-classes";
import {
    useClassesByRole,
    useArchivedClassesByRole,
} from "@/hooks/use-class-hooks";
import { CreateClassDialog } from "./-components/create-class-dialog";
import { Link } from "@tanstack/react-router";
import { UserPlus, LogIn } from "lucide-react";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/main/classes/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const { orgId } = useParams({ strict: false });
    const { classes, isLoading } = useClassesByRole(orgId);
    const { classes: archivedClasses, isLoading: isLoadingArchived } =
        useArchivedClassesByRole(orgId);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Classes
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Manage your classes
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
                    {orgId && (
                        <CreateClassDialog orgId={orgId}>
                            <Button size="lg">
                                <PlusIcon />
                                <span className="sr-only">Create Class</span>
                                <span className="hidden md:block">
                                    Create Class
                                </span>
                            </Button>
                        </CreateClassDialog>
                    )}
                </div>
            </div>

            {/* Active Classes Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                        Active Classes
                        {classes.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({classes.length})
                            </span>
                        )}
                    </h2>
                </div>
                {classes.length === 0 && !isLoading ? (
                    <ClassNoClasses
                        createClassButton={
                            orgId ? (
                                <CreateClassDialog orgId={orgId}>
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
                        joinClassButton={
                            <Button
                                size="lg"
                                variant="outline"
                                asChild
                                className="w-full"
                            >
                                <Link to="/join">
                                    <LogIn />
                                    <span>Join Class</span>
                                </Link>
                            </Button>
                        }
                        joinOrgButton={
                            <Button
                                size="lg"
                                variant="outline"
                                asChild
                                className="w-full"
                            >
                                <Link to="/join">
                                    <UserPlus />
                                    <span>Join Organization</span>
                                </Link>
                            </Button>
                        }
                    />
                ) : viewMode === "grid" ? (
                    <ClassGrid
                        classes={classes}
                        isLoading={isLoading}
                    />
                ) : (
                    <ClassList
                        classes={classes}
                        isLoading={isLoading}
                    />
                )}
            </div>

            {/* Archived Classes Section */}
            {archivedClasses.length > 0 || isLoadingArchived ? (
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
                    {archivedClasses.length === 0 && !isLoadingArchived ? (
                        <p className="text-sm text-muted-foreground">
                            No archived classes
                        </p>
                    ) : viewMode === "grid" ? (
                        <ClassGrid
                            classes={archivedClasses}
                            isLoading={isLoadingArchived}
                        />
                    ) : (
                        <ClassList
                            classes={archivedClasses}
                            isLoading={isLoadingArchived}
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
}
