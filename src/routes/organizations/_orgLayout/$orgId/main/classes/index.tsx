/** @format */

import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
    PlusIcon,
    Grid3x3Icon,
    ListIcon,
    BookOpen,
} from "lucide-react";
import { ClassGrid } from "./-components/class-grid";
import { ClassList } from "./-components/class-list";
import { ClassNoClasses } from "./-components/class-no-classes";
import { useClassesByOrgId } from "@/hooks/use-class-hooks";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/main/classes/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const { orgId } = useParams({ strict: false });
    const { classes, isLoading } = useClassesByOrgId(orgId);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    return (
        <div className="space-y-6">
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
                    <Button size="lg">
                        <PlusIcon />
                        <span className="sr-only">Create Class</span>
                        <span className="hidden md:block">Create Class</span>
                    </Button>
                </div>
            </div>

            {classes.length === 0 && !isLoading ? (
                <ClassNoClasses />
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
    );
}
