/** @format */

import { useState, useMemo } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Award, Plus, FolderPlus, ChevronDown, Folder, Search } from "lucide-react";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreateBehaviorDialog } from "./-components/create-behavior-dialog";
import { BehaviorCard } from "./-components/behavior-card";
import { CreateFolderDialog } from "../-components/folders/create-folder-dialog";
import { EditFolderDialog } from "../-components/folders/edit-folder-dialog";
import { DeleteFolderDialog } from "../-components/folders/delete-folder-dialog";
import { MoreVertical } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/behavior/behaviors/"
)({
    component: RouteComponent,
});

type Behavior = InstaQLEntity<
    AppSchema,
    "behaviors",
    { class: {}; folder?: {} }
>;

type FolderWithRelations = InstaQLEntity<
    AppSchema,
    "folders",
    { class: {}; behaviors: {}; rewardItems: {} }
>;

type BehaviorsQueryResult = { behaviors: Behavior[] };
type FoldersQueryResult = { folders: FolderWithRelations[] };

function matchItem(
    item: { name?: string; description?: string },
    q: string
): boolean {
    if (!q.trim()) return true;
    const lower = q.trim().toLowerCase();
    return (
        (item.name || "").toLowerCase().includes(lower) ||
        (item.description || "").toLowerCase().includes(lower)
    );
}

function matchFolder(
    folder: { name?: string; description?: string },
    q: string
): boolean {
    if (!q.trim()) return true;
    const lower = q.trim().toLowerCase();
    return (
        (folder.name || "").toLowerCase().includes(lower) ||
        (folder.description || "").toLowerCase().includes(lower)
    );
}

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const [search, setSearch] = useState("");
    const { class: classEntity } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const { data, isLoading: dataLoading } = db.useQuery(
        classId
            ? {
                  behaviors: {
                      $: { where: { "class.id": classId } },
                      class: {},
                      folder: {},
                  },
                  folders: {
                      $: { where: { "class.id": classId } },
                      behaviors: {},
                      rewardItems: {},
                      class: {},
                  },
              }
            : null
    );

    const typedBehaviors = (data as BehaviorsQueryResult | undefined) ?? null;
    const behaviors = typedBehaviors?.behaviors ?? [];

    const typedFolders = (data as FoldersQueryResult | undefined) ?? null;
    const folders = (typedFolders?.folders ?? []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );

    const uncategorizedBehaviors = behaviors.filter((b) => !b.folder);

    const filteredBehaviors = useMemo(
        () => behaviors.filter((b) => matchItem(b, search)),
        [behaviors, search]
    );

    const filteredUncategorizedBehaviors = useMemo(
        () => uncategorizedBehaviors.filter((b) => matchItem(b, search)),
        [uncategorizedBehaviors, search]
    );

    const filteredFolders = useMemo(() => {
        if (!search.trim()) return folders;
        return folders.filter(
            (f) =>
                matchFolder(f, search) ||
                (f.behaviors ?? []).some((b: { name?: string; description?: string }) =>
                    matchItem(b, search)
                )
        );
    }, [folders, search]);

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    if (!classId) {
        return null;
    }

    const listView = (
        <>
            {dataLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="py-6">
                                <Skeleton className="h-6 w-48 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : behaviors.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            No behaviors have been created yet.
                        </p>
                        {canManage && (
                            <CreateBehaviorDialog classId={classId}>
                                <Button>
                                    <Plus className="size-4 mr-2" />
                                    Create Your First Behavior
                                </Button>
                            </CreateBehaviorDialog>
                        )}
                    </CardContent>
                </Card>
            ) : filteredBehaviors.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No results for &quot;{search.trim()}&quot;.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredBehaviors.map((behavior) => (
                        <BehaviorCard
                            key={behavior.id}
                            behavior={behavior}
                            classId={classId}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}
        </>
    );

    const foldersView = (
        <>
            <div className="flex items-center justify-between mb-4">
                {canManage && (
                    <CreateFolderDialog classId={classId}>
                        <Button variant="outline">
                            <FolderPlus className="size-4 mr-2" />
                            Create folder
                        </Button>
                    </CreateFolderDialog>
                )}
            </div>

            {dataLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <Card key={i}>
                            <CardContent className="py-6">
                                <Skeleton className="h-6 w-48" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : folders.length === 0 && uncategorizedBehaviors.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Folder className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            No folders yet. Create your first folder to organize
                            behaviors.
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            You can assign behaviors to folders when creating or
                            editing them.
                        </p>
                        {canManage && (
                            <CreateFolderDialog classId={classId}>
                                <Button>
                                    <FolderPlus className="size-4 mr-2" />
                                    Create your first folder
                                </Button>
                            </CreateFolderDialog>
                        )}
                    </CardContent>
                </Card>
            ) : search.trim() &&
              filteredFolders.length === 0 &&
              filteredUncategorizedBehaviors.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No results for &quot;{search.trim()}&quot;.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredFolders.map((folder) => {
                        const folderBehaviors = (folder.behaviors ?? []).filter(
                            (b: { name?: string; description?: string }) =>
                                matchItem(b, search)
                        );
                        return (
                            <Collapsible key={folder.id} defaultOpen={true}>
                                <Card>
                                    <div className="flex items-center justify-between pr-2">
                                        <CollapsibleTrigger asChild>
                                            <CardContent className="group flex flex-1 items-center gap-3 py-4 cursor-pointer hover:bg-muted/50 rounded-lg">
                                                <Folder className="size-5 text-primary shrink-0" />
                                                <span className="font-medium">
                                                    {folder.name}
                                                </span>
                                                <Badge variant="secondary">
                                                    {folderBehaviors.length}
                                                </Badge>
                                                <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                                            </CardContent>
                                        </CollapsibleTrigger>
                                        {canManage && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <MoreVertical className="size-4" />
                                                        <span className="sr-only">
                                                            Folder options
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <EditFolderDialog
                                                        folder={folder}
                                                        asDropdownItem
                                                    >
                                                        Edit
                                                    </EditFolderDialog>
                                                    <DeleteFolderDialog
                                                        folder={folder}
                                                        asDropdownItem
                                                    >
                                                        Delete
                                                    </DeleteFolderDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                    <CollapsibleContent>
                                        <CardContent className="pt-0 pb-4 space-y-4">
                                            {folderBehaviors.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-2">
                                                    No behaviors in this folder.
                                                </p>
                                            ) : (
                                                folderBehaviors.map((b) => (
                                                    <BehaviorCard
                                                        key={b.id}
                                                        behavior={b}
                                                        classId={classId}
                                                        canManage={canManage}
                                                    />
                                                ))
                                            )}
                                            {canManage && (
                                                <CreateBehaviorDialog
                                                    classId={classId}
                                                    initialFolderId={folder.id}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Plus className="size-4 mr-2" />
                                                        Add behavior
                                                    </Button>
                                                </CreateBehaviorDialog>
                                            )}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        );
                    })}

                    <Collapsible defaultOpen={true}>
                        <Card>
                            <CollapsibleTrigger asChild>
                                <CardContent className="group flex items-center gap-3 py-4 cursor-pointer hover:bg-muted/50 rounded-lg">
                                    <Folder className="size-5 text-muted-foreground shrink-0" />
                                    <span className="font-medium">
                                        Uncategorized
                                    </span>
                                    <Badge variant="secondary">
                                        {filteredUncategorizedBehaviors.length}
                                    </Badge>
                                    <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                                </CardContent>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0 pb-4 space-y-4">
                                    {filteredUncategorizedBehaviors.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-2">
                                            No uncategorized behaviors.
                                        </p>
                                    ) : (
                                        filteredUncategorizedBehaviors.map((b) => (
                                            <BehaviorCard
                                                key={b.id}
                                                behavior={b}
                                                classId={classId}
                                                canManage={canManage}
                                            />
                                        ))
                                    )}
                                    {canManage && (
                                        <CreateBehaviorDialog
                                            classId={classId}
                                            initialFolderId={null}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Plus className="size-4 mr-2" />
                                                Add behavior
                                            </Button>
                                        </CreateBehaviorDialog>
                                    )}
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Behaviors
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            View and manage behaviors for your class
                        </p>
                    </div>
                </div>
                {canManage && (
                    <CreateBehaviorDialog classId={classId}>
                        <Button>
                            <Plus className="size-4 mr-2" />
                            Create Behavior
                        </Button>
                    </CreateBehaviorDialog>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search name and description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="folders">Folders</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="mt-4">
                    {listView}
                </TabsContent>
                <TabsContent value="folders" className="mt-4">
                    {foldersView}
                </TabsContent>
            </Tabs>
        </div>
    );
}
