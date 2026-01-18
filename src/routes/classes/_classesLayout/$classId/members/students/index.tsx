/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { StudentIcon } from "@/components/icons/role-icons";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { usePendingMembers } from "@/hooks/use-pending-members";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, X, MoreVertical, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db/db";
import { useState } from "react";
import { KickUserDialog } from "@/components/members/kick-user-dialog";
import { PendingStudentCard } from "@/components/members/pending-student-card";
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
import { EditStudentDialog } from "@/routes/classes/_classesLayout/$classId/behavior/points/-components/edit-student-dialog";
import { displayNameForStudent } from "@/lib/roster-utils";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/students/"
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


type RosterForDisplay = {
    id: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    number?: number;
} | null;

function StudentCard({
    student,
    canManage,
    classGuardians,
    classId,
    roster,
}: {
    student: InstaQLEntity<AppSchema, "$users">;
    canManage: boolean;
    classGuardians: InstaQLEntity<AppSchema, "$users">[];
    classId: string;
    roster: RosterForDisplay;
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

    const displayName = displayNameForStudent(student, roster);
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Get available guardians (not already guardians of this student)
    const availableGuardians = classGuardians.filter(
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
                                    <EditStudentDialog
                                        student={student}
                                        classId={classId}
                                        existingRoster={roster}
                                        asDropdownItem
                                    >
                                        <Pencil className="size-4" /> Edit
                                        student
                                    </EditStudentDialog>
                                    <KickUserDialog
                                        user={student}
                                        contextType="class"
                                        contextId={classId}
                                        canKick={canManage}
                                        asDropdownItem
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

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
                            <RoleManager
                                user={student}
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
    const classId = params.classId;
    
    if (!classId) {
        return null;
    }
    
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const rosterQuery =
        classId && classId.trim() !== ""
            ? {
                  class_roster: {
                      $: { where: { "class.id": classId } },
                      student: {},
                  },
              }
            : null;
    const { data: rosterData } = db.useQuery(rosterQuery);

    const rosterByStudentId = useMemo(() => {
        const m = new Map<
            string,
            { id: string; firstName?: string; lastName?: string; gender?: string; number?: number }
        >();
        const list = (rosterData as { class_roster?: Array<{ id: string; firstName?: string; lastName?: string; gender?: string; number?: number; student?: { id: string } }> } | undefined)?.class_roster ?? [];
        for (const r of list) {
            if (r.student?.id) m.set(r.student.id, r);
        }
        return m;
    }, [(rosterData as { class_roster?: unknown[] } | undefined)?.class_roster]);

    const students = classEntity?.classStudents || [];
    const guardians = classEntity?.classGuardians || [];
    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    // Use hook to fetch pending members filtered by student role
    const { pendingMembers } = usePendingMembers(classId, "student");

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
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
                                View and manage students in your class
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
                ) : (
                    <>
                        {pendingMembers.length > 0 && canManage && (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold mb-2">
                                        Pending Invitations
                                    </h2>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        These students have been invited but haven't
                                        signed up yet. They'll be automatically added
                                        when they create an account with the same email.
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {pendingMembers.map((pending) => (
                                        <PendingStudentCard
                                            key={pending.id}
                                            pendingMember={pending}
                                            canManage={canManage}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pendingMembers.length > 0 && canManage && (
                            <div className="border-t pt-6" />
                        )}

                        <div className="space-y-4">
                            {students.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Users className="size-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">
                                            No students have been added to this class yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    <div>
                                        <h2 className="text-lg font-semibold mb-2">
                                            Active Students
                                        </h2>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {students.map((student) => (
                                            <StudentCard
                                                key={student.id}
                                                student={student}
                                                canManage={canManage}
                                                classGuardians={guardians}
                                                classId={classId}
                                                roster={
                                                    rosterByStudentId.get(
                                                        student.id
                                                    ) ?? null
                                                }
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </RestrictedRoute>
    );
}
