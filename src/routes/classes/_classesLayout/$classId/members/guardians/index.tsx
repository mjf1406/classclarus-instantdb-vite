/** @format */

import { createFileRoute } from "@tanstack/react-router";
import { GuardianIcon } from "@/components/icons/role-icons";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { useParams } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, X, MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db/db";
import { useState } from "react";
import { KickUserDialog } from "@/components/members/kick-user-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { RoleManager } from "@/components/members/role-manager";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/guardians/"
)({
    component: RouteComponent,
});

type UserWithChildren = InstaQLEntity<
    AppSchema,
    "$users",
    {
        children: {};
    }
>;

type UserQueryResult = {
    $users: UserWithChildren[];
};

function GuardianCard({
    guardian,
    canManage,
    classStudents,
    classId,
}: {
    guardian: InstaQLEntity<AppSchema, "$users">;
    canManage: boolean;
    classStudents: InstaQLEntity<AppSchema, "$users">[];
    classId: string;
}) {
    const [open, setOpen] = useState(false);
    const [selectedChildId, setSelectedChildId] = useState<string>("");
    const [isLinking, setIsLinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Query children for this guardian
    const { data: userData } = db.useQuery({
        $users: {
            $: { where: { id: guardian.id } },
            children: {},
        },
    });

    const typedUserData = (userData as UserQueryResult | undefined) ?? null;
    const guardianWithChildren = typedUserData?.$users?.[0];
    const children = guardianWithChildren?.children || [];

    const handleLinkChild = async () => {
        if (!selectedChildId) {
            setError("Please select a child");
            return;
        }

        setIsLinking(true);
        setError(null);

        try {
            db.transact([
                db.tx.$users[guardian.id].link({ children: selectedChildId }),
            ]);
            setOpen(false);
            setSelectedChildId("");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to link child"
            );
        } finally {
            setIsLinking(false);
        }
    };

    const handleUnlinkChild = async (childId: string) => {
        try {
            db.transact([
                db.tx.$users[guardian.id].unlink({ children: childId }),
            ]);
        } catch (err) {
            console.error("Failed to unlink child:", err);
        }
    };

    const displayName =
        `${guardian.firstName || ""} ${guardian.lastName || ""}`.trim() ||
        guardian.email ||
        "Unknown User";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Get available students (not already children of this guardian)
    const availableStudents = classStudents.filter(
        (student) => !children.some((child) => child.id === student.id)
    );

    return (
        <Card>
            <CardContent className="py-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage
                                src={guardian.avatarURL || guardian.imageURL}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                                {displayName}
                            </div>
                            {guardian.email && (
                                <div className="text-sm text-muted-foreground truncate">
                                    {guardian.email}
                                </div>
                            )}
                        </div>
                        {canManage && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                    >
                                        <MoreVertical className="size-4" />
                                        <span className="sr-only">
                                            More options
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <KickUserDialog
                                        user={guardian}
                                        contextType="class"
                                        contextId={classId}
                                        canKick={canManage}
                                        asDropdownItem
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {children.length > 0 && (
                        <div className="ml-14 space-y-2">
                            <div className="text-sm font-medium">
                                Children ({children.length}):
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {children.map((child) => {
                                    const childDisplayName =
                                        `${child.firstName || ""} ${child.lastName || ""}`.trim() ||
                                        child.email ||
                                        "Unknown User";
                                    return (
                                        <Badge
                                            key={child.id}
                                            variant="outline"
                                            className="flex items-center gap-1"
                                        >
                                            {childDisplayName}
                                            {canManage && (
                                                <button
                                                    onClick={() =>
                                                        handleUnlinkChild(
                                                            child.id
                                                        )
                                                    }
                                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                    aria-label={`Remove ${childDisplayName}`}
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            )}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {canManage && (
                        <div className="ml-14 space-y-2">
                            <RoleManager
                                user={guardian}
                                contextType="class"
                                contextId={classId}
                                canManage={canManage}
                            />
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Plus className="size-4" />
                                        Add Child
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Child</DialogTitle>
                                        <DialogDescription>
                                            Link a student as a child of this
                                            guardian.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Field>
                                            <FieldLabel htmlFor="child-select">
                                                Student
                                            </FieldLabel>
                                            <FieldContent>
                                                <Select
                                                    value={selectedChildId}
                                                    onValueChange={
                                                        setSelectedChildId
                                                    }
                                                >
                                                    <SelectTrigger id="child-select">
                                                        <SelectValue placeholder="Select a student" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableStudents.length ===
                                                        0 ? (
                                                            <SelectItem
                                                                value=""
                                                                disabled
                                                            >
                                                                No available
                                                                students
                                                            </SelectItem>
                                                        ) : (
                                                            availableStudents.map(
                                                                (student) => {
                                                                    const studentDisplayName =
                                                                        `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                                                                        student.email ||
                                                                        "Unknown User";
                                                                    return (
                                                                        <SelectItem
                                                                            key={
                                                                                student.id
                                                                            }
                                                                            value={
                                                                                student.id
                                                                            }
                                                                        >
                                                                            {
                                                                                studentDisplayName
                                                                            }
                                                                        </SelectItem>
                                                                    );
                                                                }
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {error && (
                                                    <FieldError>
                                                        {error}
                                                    </FieldError>
                                                )}
                                                <FieldDescription>
                                                    Select a student to link as
                                                    a child of this guardian.
                                                </FieldDescription>
                                            </FieldContent>
                                        </Field>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleLinkChild}
                                            disabled={
                                                !selectedChildId || isLinking
                                            }
                                        >
                                            {isLinking
                                                ? "Linking..."
                                                : "Link Child"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    
    if (!classId) {
        return null;
    }
    
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const guardians = classEntity?.classGuardians || [];
    const students = classEntity?.classStudents || [];
    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GuardianIcon className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Guardians
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            View and manage guardians in your class
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            ) : guardians.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No guardians have been added to this class yet.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {guardians.map((guardian) => (
                        <GuardianCard
                            key={guardian.id}
                            guardian={guardian}
                            canManage={canManage}
                            classStudents={students}
                            classId={classId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
