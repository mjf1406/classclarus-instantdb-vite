/** @format */

import { useState, useMemo } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Star, Plus, FolderPlus, ChevronDown, Folder, Search, LayoutGrid, List, MoreVertical } from "lucide-react";
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
import { CreateRewardItemDialog } from "./-components/create-reward-item-dialog";
import { RewardItemCard } from "./-components/reward-item-card";
import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import { CreateFolderDialog } from "../-components/folders/create-folder-dialog";
import { EditFolderDialog } from "../-components/folders/edit-folder-dialog";
import { DeleteFolderDialog } from "../-components/folders/delete-folder-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/behavior/reward-items/"
)({
    component: RouteComponent,
});

type RewardItem = InstaQLEntity<
    AppSchema,
    "reward_items",
    { class: {}; folder?: {} }
>;

type FolderWithRelations = InstaQLEntity<
    AppSchema,
    "folders",
    { class: {}; behaviors: {}; rewardItems: {} }
>;

type RewardItemsQueryResult = { reward_items: RewardItem[] };
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
    const [isFolderMobile] = useState(() =>
        typeof window !== "undefined"
            ? window.matchMedia("(max-width: 767px)").matches
            : false
    );
    const { class: classEntity } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const { data, isLoading: dataLoading } = db.useQuery(
        classId
            ? {
                  reward_items: {
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

    const typedRewardItems =
        (data as RewardItemsQueryResult | undefined) ?? null;
    const rewardItems = typedRewardItems?.reward_items ?? [];

    const typedFolders = (data as FoldersQueryResult | undefined) ?? null;
    const folders = (typedFolders?.folders ?? []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );

    const uncategorizedRewardItems = rewardItems.filter((r) => !r.folder);

    const filteredRewardItems = useMemo(
        () => rewardItems.filter((r) => matchItem(r, search)),
        [rewardItems, search]
    );

    const filteredUncategorizedRewardItems = useMemo(
        () => uncategorizedRewardItems.filter((r) => matchItem(r, search)),
        [uncategorizedRewardItems, search]
    );

    const filteredFolders = useMemo(() => {
        if (!search.trim()) return folders;
        return folders.filter(
            (f) =>
                matchFolder(f, search) ||
                (f.rewardItems ?? []).some((r: { name?: string; description?: string }) =>
                    matchItem(r, search)
                )
        );
    }, [folders, search]);

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    if (!classId) {
        return null;
    }

    const gridView = (
        <>
            {dataLoading ? (
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="py-6">
                                <Skeleton className="h-6 w-48 mb-4" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : rewardItems.length === 0 ? (
                <div className="grid grid-cols-4 gap-4">
                    <Card className="col-span-4">
                        <CardContent className="py-12 text-center">
                            <Star className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No reward items have been created yet.
                            </p>
                            {canManage && (
                                <CreateRewardItemDialog classId={classId}>
                                    <Button>
                                        <Plus className="size-4 mr-2" />
                                        Create Your First Reward Item
                                    </Button>
                                </CreateRewardItemDialog>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : filteredRewardItems.length === 0 ? (
                <div className="grid grid-cols-4 gap-4">
                    <Card className="col-span-4">
                        <CardContent className="py-12 text-center">
                            <Search className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                No results for &quot;{search.trim()}&quot;.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4">
                    {filteredRewardItems.map((rewardItem) => (
                        <RewardItemCard
                            key={rewardItem.id}
                            rewardItem={rewardItem}
                            classId={classId}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}
        </>
    );

    const listView = (
        <>
            {dataLoading ? (
                <div className="grid grid-cols-1 gap-4">
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
            ) : rewardItems.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Star className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            No reward items have been created yet.
                        </p>
                        {canManage && (
                            <CreateRewardItemDialog classId={classId}>
                                <Button>
                                    <Plus className="size-4 mr-2" />
                                    Create Your First Reward Item
                                </Button>
                            </CreateRewardItemDialog>
                        )}
                    </CardContent>
                </Card>
            ) : filteredRewardItems.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No results for &quot;{search.trim()}&quot;.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRewardItems.map((rewardItem) => (
                        <RewardItemCard
                            key={rewardItem.id}
                            rewardItem={rewardItem}
                            classId={classId}
                            canManage={canManage}
                            preferDesktop
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
            ) : folders.length === 0 &&
              uncategorizedRewardItems.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Folder className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            No folders yet. Create your first folder to organize
                            reward items.
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                            You can assign reward items to folders when creating
                            or editing them.
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
              filteredUncategorizedRewardItems.length === 0 ? (
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
                        const folderRewardItems = (folder.rewardItems ?? []).filter(
                            (r: { name?: string; description?: string }) =>
                                matchItem(r, search)
                        );
                        return (
                            <Collapsible
                                key={folder.id}
                                defaultOpen={!isFolderMobile}
                            >
                                <Card>
                                    <div className="flex items-center justify-between pr-2">
                                        <CollapsibleTrigger asChild>
                                            <CardContent className="group flex flex-1 items-center gap-3 py-4 cursor-pointer hover:bg-muted/50 rounded-lg">
                                                {folder.icon ? (
                                                    <FontAwesomeIconFromId
                                                        id={folder.icon}
                                                        className="size-5 text-primary shrink-0"
                                                        fallback={
                                                            <Folder className="size-5 text-primary shrink-0" />
                                                        }
                                                    />
                                                ) : (
                                                    <Folder className="size-5 text-primary shrink-0" />
                                                )}
                                                <span className="font-medium">
                                                    {folder.name}
                                                </span>
                                                <Badge variant="secondary">
                                                    {folderRewardItems.length}
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
                                            {folderRewardItems.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-2">
                                                    No reward items in this
                                                    folder.
                                                </p>
                                            ) : (
                                                folderRewardItems.map((r) => (
                                                    <RewardItemCard
                                                        key={r.id}
                                                        rewardItem={r}
                                                        classId={classId}
                                                        canManage={canManage}
                                                        preferDesktop
                                                    />
                                                ))
                                            )}
                                            {canManage && (
                                                <CreateRewardItemDialog
                                                    classId={classId}
                                                    initialFolderId={folder.id}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Plus className="size-4 mr-2" />
                                                        Add reward item
                                                    </Button>
                                                </CreateRewardItemDialog>
                                            )}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        );
                    })}

                    <Collapsible defaultOpen={!isFolderMobile}>
                        <Card>
                            <CollapsibleTrigger asChild>
                                <CardContent className="group flex items-center gap-3 py-4 cursor-pointer hover:bg-muted/50 rounded-lg">
                                    <Folder className="size-5 text-muted-foreground shrink-0" />
                                    <span className="font-medium">
                                        Uncategorized
                                    </span>
                                    <Badge variant="secondary">
                                        {filteredUncategorizedRewardItems.length}
                                    </Badge>
                                    <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                                </CardContent>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0 pb-4 space-y-4">
                                    {filteredUncategorizedRewardItems.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-2">
                                            No uncategorized reward items.
                                        </p>
                                    ) : (
                                        filteredUncategorizedRewardItems.map((r) => (
                                            <RewardItemCard
                                                key={r.id}
                                                rewardItem={r}
                                                classId={classId}
                                                canManage={canManage}
                                                preferDesktop
                                            />
                                        ))
                                    )}
                                    {canManage && (
                                        <CreateRewardItemDialog
                                            classId={classId}
                                            initialFolderId={null}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                            >
                                                <Plus className="size-4 mr-2" />
                                                Add reward item
                                            </Button>
                                        </CreateRewardItemDialog>
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
                    <Star className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Reward Items
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            View and manage reward items for your class
                        </p>
                    </div>
                </div>
                {canManage && (
                    <CreateRewardItemDialog classId={classId}>
                        <Button>
                            <Plus className="size-4 mr-2" />
                            Create Reward Item
                        </Button>
                    </CreateRewardItemDialog>
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

            <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="grid" className="gap-1.5">
                        <LayoutGrid className="size-4" />
                        Grid
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-1.5">
                        <List className="size-4" />
                        List
                    </TabsTrigger>
                    <TabsTrigger value="folders" className="gap-1.5">
                        <Folder className="size-4" />
                        Folders
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="grid" className="mt-4">
                    {gridView}
                </TabsContent>
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
