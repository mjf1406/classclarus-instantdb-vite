/** @format */

import { createFileRoute, Link } from "@tanstack/react-router";
import { StudentIcon } from "@/components/icons/role-icons";
import { useOrgClassRoleMembers } from "@/hooks/use-org-class-role-members";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgRole } from "@/hooks/use-org-role";
import { useParams } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, X, MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db/db";
import { useState, useMemo } from "react";
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
import { RestrictedRoute } from "@/components/auth/restricted-route";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/students/"
)({
    component: RouteComponent,
});

type UserWithGuardians = InstaQLEntity<
    AppSchema,
    "$users",
    {
        guardians: {};
    }
>;

type UserQueryResult = {
    $users: UserWithGuardians[];
};

type ClassWithGuardians = InstaQLEntity<
    AppSchema,
    "classes",
    {
        classGuardians: {};
    }
>;

type ClassQueryResult = {
    classes: ClassWithGuardians[];
};

function StudentCard({
    student,
    classes,
    canManage,
    orgGuardians,
}: {
    student: InstaQLEntity<AppSchema, "$users">;
    classes: Array<{ id: string; name: string }>;
    canManage: boolean;
    orgGuardians: InstaQLEntity<AppSchema, "$users">[];
}) {
    const [open, setOpen] = useState(false);
    const [selectedGuardianId, setSelectedGuardianId] = useState<string>("");
    const [isLinking, setIsLinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Query guardians for this student
    const { data: userData } = db.useQuery({
        $users: {
            $: { where: { id: student.id } },
            guardians: {},
        },
    });

    const typedUserData = (userData as UserQueryResult | undefined) ?? null;
    const studentWithGuardians = typedUserData?.$users?.[0];
    const guardians = studentWithGuardians?.guardians || [];

    const handleLinkGuardian = async () => {
        if (!selectedGuardianId) {
            setError("Please select a guardian");
            return;
        }

        setIsLinking(true);
        setError(null);

        try {
            // Link guardian to student (reverse relationship)
            db.transact([
                db.tx.$users[selectedGuardianId].link({ children: student.id }),
            ]);
            setOpen(false);
            setSelectedGuardianId("");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to link guardian"
            );
        } finally {
            setIsLinking(false);
        }
    };

    const handleUnlinkGuardian = async (guardianId: string) => {
        try {
            // Unlink guardian from student (reverse relationship)
            db.transact([
                db.tx.$users[guardianId].unlink({ children: student.id }),
            ]);
        } catch (err) {
            console.error("Failed to unlink guardian:", err);
        }
    };

    const displayName =
        `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
        student.email ||
        "Unknown User";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Get available guardians (not already guardians of this student)
    const availableGuardians = orgGuardians.filter(
        (guardian) => !guardians.some((g) => g.id === guardian.id)
    );

    return (
        <Card>
            <CardContent className="py-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage
                                src={student.avatarURL || student.imageURL}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                                {displayName}
                            </div>
                            {student.email && (
                                <div className="text-sm text-muted-foreground truncate">
                                    {student.email}
                                </div>
                            )}
                        </div>
                        <Badge variant="secondary">
                            {classes.length}{" "}
                            {classes.length === 1 ? "class" : "classes"}
                        </Badge>
                        {canManage && classes.length > 0 && (
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
                                        user={student}
                                        contextType="class"
                                        contextId={classes[0].id}
                                        canKick={canManage}
                                        asDropdownItem
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {classes.length > 0 && (
                        <div className="ml-14 space-y-1">
                            <div className="text-sm font-medium mb-2">
                                Classes:
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {classes.map((cls) => (
                                    <Link
                                        key={cls.id}
                                        to="/classes/$classId"
                                        params={{
                                            classId: cls.id,
                                        }}
                                    >
                                        <Badge
                                            variant="outline"
                                            className="cursor-pointer hover:bg-muted"
                                        >
                                            {cls.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {guardians.length > 0 && (
                        <div className="ml-14 space-y-2">
                            <div className="text-sm font-medium">
                                Guardians ({guardians.length}):
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {guardians.map((guardian) => {
                                    const guardianDisplayName =
                                        `${guardian.firstName || ""} ${guardian.lastName || ""}`.trim() ||
                                        guardian.email ||
                                        "Unknown User";
                                    return (
                                        <Badge
                                            key={guardian.id}
                                            variant="outline"
                                            className="flex items-center gap-1"
                                        >
                                            {guardianDisplayName}
                                            {canManage && (
                                                <button
                                                    onClick={() =>
                                                        handleUnlinkGuardian(
                                                            guardian.id
                                                        )
                                                    }
                                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                    aria-label={`Remove ${guardianDisplayName}`}
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
                            {classes.length > 0 && (
                                <RoleManager
                                    user={student}
                                    contextType="class"
                                    contextId={classes[0].id}
                                    canManage={canManage}
                                />
                            )}
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Plus className="size-4" />
                                        Add Guardian
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Guardian</DialogTitle>
                                        <DialogDescription>
                                            Link a guardian to this student.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Field>
                                            <FieldLabel htmlFor="guardian-select">
                                                Guardian
                                            </FieldLabel>
                                            <FieldContent>
                                                <Select
                                                    value={selectedGuardianId}
                                                    onValueChange={
                                                        setSelectedGuardianId
                                                    }
                                                >
                                                    <SelectTrigger id="guardian-select">
                                                        <SelectValue placeholder="Select a guardian" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableGuardians.length ===
                                                        0 ? (
                                                            <SelectItem
                                                                value=""
                                                                disabled
                                                            >
                                                                No available
                                                                guardians
                                                            </SelectItem>
                                                        ) : (
                                                            availableGuardians.map(
                                                                (guardian) => {
                                                                    const guardianDisplayName =
                                                                        `${guardian.firstName || ""} ${guardian.lastName || ""}`.trim() ||
                                                                        guardian.email ||
                                                                        "Unknown User";
                                                                    return (
                                                                        <SelectItem
                                                                            key={
                                                                                guardian.id
                                                                            }
                                                                            value={
                                                                                guardian.id
                                                                            }
                                                                        >
                                                                            {
                                                                                guardianDisplayName
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
                                                    Select a guardian to link to
                                                    this student.
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
                                            onClick={handleLinkGuardian}
                                            disabled={
                                                !selectedGuardianId || isLinking
                                            }
                                        >
                                            {isLinking
                                                ? "Linking..."
                                                : "Link Guardian"}
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
    const orgId = params.orgId;
    const { users, isLoading } = useOrgClassRoleMembers(orgId, "classStudents");
    const { organization, isLoading: orgLoading } = useOrganizationById(orgId);
    const roleInfo = useOrgRole(organization);

    const canManage = roleInfo.isOwner || roleInfo.isAdmin;

    // Query all guardians in the organization
    const { data: classData } = db.useQuery(
        orgId
            ? {
                  classes: {
                      $: {
                          where: {
                              and: [
                                  { "organization.id": orgId },
                                  { archivedAt: { $isNull: true } },
                              ],
                          },
                      },
                      classGuardians: {},
                  },
              }
            : null
    );

    const typedClassData = (classData as ClassQueryResult | undefined) ?? null;
    const classes = typedClassData?.classes || [];

    // Get all unique guardians from all classes
    const orgGuardians = useMemo(() => {
        const guardianMap = new Map<
            string,
            InstaQLEntity<AppSchema, "$users">
        >();
        for (const cls of classes) {
            for (const guardian of cls.classGuardians || []) {
                if (guardian.id && !guardianMap.has(guardian.id)) {
                    guardianMap.set(guardian.id, guardian);
                }
            }
        }
        return Array.from(guardianMap.values());
    }, [classes]);

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={orgLoading}
            restrictNullRole
            backUrl={orgId ? `/organizations/${orgId}` : "/organizations"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <StudentIcon className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Students
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View students in classes within this organization
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
                ) : users.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                No students found in any classes within this
                                organization.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {users.map(({ user, classes: userClasses }) => (
                            <StudentCard
                                key={user.id}
                                student={user}
                                classes={userClasses}
                                canManage={canManage}
                                orgGuardians={orgGuardians}
                            />
                        ))}
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
