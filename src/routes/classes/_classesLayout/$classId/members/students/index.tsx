/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { id } from "@instantdb/react";
import { useMemo } from "react";
import { StudentIcon } from "@/components/icons/role-icons";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { usePendingMembers } from "@/hooks/use-pending-members";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, X, MoreVertical, Pencil, LayoutGrid, Table2, Check, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db/db";
import { useState } from "react";
import { KickUserDialog } from "@/components/members/kick-user-dialog";
import { PendingStudentCard } from "@/components/members/pending-student-card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { GenderSelect, GENDER_NONE, GENDER_OPTIONS } from "@/routes/classes/_classesLayout/$classId/behavior/points/-components/gender-select";

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

function ManageGuardiansDialog({
    student,
    classGuardians,
    open,
    onOpenChange,
}: {
    student: InstaQLEntity<AppSchema, "$users">;
    classGuardians: InstaQLEntity<AppSchema, "$users">[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
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
            db.transact([
                db.tx.$users[selectedGuardianId].link({ children: student.id }),
            ]);
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
            db.transact([
                db.tx.$users[guardianId].unlink({ children: student.id }),
            ]);
        } catch (err) {
            console.error("Failed to unlink guardian:", err);
        }
    };

    // Get available guardians (not already guardians of this student)
    const availableGuardians = classGuardians.filter(
        (guardian) => !guardians.some((g) => g.id === guardian.id)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Guardians</DialogTitle>
                    <DialogDescription>
                        Add or remove guardians for this student.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {guardians.length > 0 && (
                        <Field>
                            <FieldLabel>Current Guardians</FieldLabel>
                            <FieldContent>
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
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </FieldContent>
                        </Field>
                    )}
                    <Field>
                        <FieldLabel htmlFor="guardian-select">
                            Add Guardian
                        </FieldLabel>
                        <FieldContent>
                            <Select
                                value={selectedGuardianId}
                                onValueChange={setSelectedGuardianId}
                                disabled={availableGuardians.length === 0}
                            >
                                <SelectTrigger id="guardian-select">
                                    <SelectValue placeholder={availableGuardians.length === 0 ? "No available guardians" : "Select a guardian"} />
                                </SelectTrigger>
                                {availableGuardians.length > 0 && (
                                    <SelectContent>
                                        {availableGuardians.map((guardian) => {
                                            const guardianDisplayName =
                                                `${guardian.firstName || ""} ${guardian.lastName || ""}`.trim() ||
                                                guardian.email ||
                                                "Unknown User";
                                            return (
                                                <SelectItem
                                                    key={guardian.id}
                                                    value={guardian.id}
                                                >
                                                    {guardianDisplayName}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                )}
                            </Select>
                            {error && <FieldError>{error}</FieldError>}
                            <FieldDescription>
                                Select a guardian to link to this student.
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleLinkGuardian}
                        disabled={!selectedGuardianId || isLinking}
                    >
                        {isLinking ? "Linking..." : "Add Guardian"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
    const [manageGuardiansOpen, setManageGuardiansOpen] = useState(false);
    const [roleManagerOpen, setRoleManagerOpen] = useState(false);

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

    const displayName = displayNameForStudent(student, roster);
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

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
                            <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                                <div>
                                    User: {student.firstName || "—"} {student.lastName || "—"}
                                    {" · "}
                                    Last logon: {student.lastLogon ? format(new Date(student.lastLogon), "MMM d, yyyy") : "—"}
                                </div>
                                <div>
                                    Roster: #{roster?.number ?? "—"} · {roster?.firstName || "—"} {roster?.lastName || "—"} · {roster?.gender ?? "—"}
                                </div>
                            </div>
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
                                    <DropdownMenuItem
                                        onSelect={() => setRoleManagerOpen(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Settings2 className="size-4" />
                                        Manage roles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => setManageGuardiansOpen(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Users className="size-4" />
                                        Manage Guardians
                                    </DropdownMenuItem>
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
                                hideTrigger
                                open={roleManagerOpen}
                                onOpenChange={setRoleManagerOpen}
                            />
                            <ManageGuardiansDialog
                                student={student}
                                classGuardians={classGuardians}
                                open={manageGuardiansOpen}
                                onOpenChange={setManageGuardiansOpen}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function getGenderLabel(gender?: string | null): string {
    if (!gender) return "—";
    const option = GENDER_OPTIONS.find((opt) => opt.value === gender);
    return option?.label || gender;
}

function getInitialEditValue(columnKey: string, roster: RosterForDisplay): string {
    switch (columnKey) {
        case "roster.number":
            return roster?.number != null ? String(roster.number) : "";
        case "roster.firstName":
            return roster?.firstName ?? "";
        case "roster.lastName":
            return roster?.lastName ?? "";
        case "roster.gender":
            return roster?.gender || GENDER_NONE;
        default:
            return "";
    }
}

function getInputType(columnKey: string): "text" | "number" {
    if (columnKey === "roster.number") return "number";
    return "text";
}

function StudentsTable({
    students,
    canManage,
    classId,
    rosterByStudentId,
    guardianNamesByStudentId,
    classGuardians,
}: {
    students: InstaQLEntity<AppSchema, "$users">[];
    canManage: boolean;
    classId: string;
    rosterByStudentId: Map<string, RosterForDisplay>;
    guardianNamesByStudentId: Map<string, string[]>;
    classGuardians: InstaQLEntity<AppSchema, "$users">[];
}) {
    const [editingCell, setEditingCell] = useState<{ studentId: string; columnKey: string } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [manageGuardiansForStudent, setManageGuardiansForStudent] = useState<InstaQLEntity<AppSchema, "$users"> | null>(null);

    const handleStartEdit = (studentId: string, columnKey: string, roster: RosterForDisplay) => {
        if (!canManage) return;
        setEditingCell({ studentId, columnKey });
        setEditValue(getInitialEditValue(columnKey, roster));
    };

    const handleSaveEdit = () => {
        if (!editingCell) return;
        const { studentId, columnKey } = editingCell;
        const roster = rosterByStudentId.get(studentId) ?? null;

        const field = columnKey.split(".")[1] as string;
        let parsed: string | number | undefined;
        switch (columnKey) {
            case "roster.number": {
                const v = editValue.trim();
                parsed = v === "" ? undefined : Number(v);
                if (parsed !== undefined && Number.isNaN(parsed)) parsed = undefined;
                break;
            }
            case "roster.gender":
                parsed = editValue === GENDER_NONE || !editValue ? undefined : editValue;
                break;
            default:
                parsed = editValue.trim() || undefined;
        }

        try {
            if (roster) {
                db.transact(db.tx.class_roster[roster.id].update({ [field]: parsed }));
            } else {
                const payload: Record<string, unknown> = { [field]: parsed };
                db.transact(
                    db.tx.class_roster[id()].create(payload).link({ class: classId }).link({ student: studentId })
                );
            }
            setEditingCell(null);
        } catch {
            // leave editing state on error; user can cancel
        }
    };

    const handleCancelEdit = () => setEditingCell(null);

    const isEditing = (studentId: string, columnKey: string) =>
        editingCell?.studentId === studentId && editingCell?.columnKey === columnKey;

    const renderEditableCell = (studentId: string, columnKey: string, displayVal: string) => {
        if (canManage && isEditing(studentId, columnKey)) {
            // Special handling for gender - use Select dropdown
            if (columnKey === "roster.gender") {
                return (
                    <div className="flex items-center gap-1 min-w-0">
                        <GenderSelect
                            value={editValue}
                            onValueChange={setEditValue}
                            className="h-8 flex-1 min-w-0"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleSaveEdit} aria-label="Save">
                            <Check className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCancelEdit} aria-label="Cancel">
                            <X className="size-4" />
                        </Button>
                    </div>
                );
            }
            // For other fields, use Input
            return (
                <div className="flex items-center gap-1 min-w-0">
                    <Input
                        type={getInputType(columnKey)}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            else if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                        className="h-8 flex-1 min-w-0"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleSaveEdit} aria-label="Save">
                        <Check className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCancelEdit} aria-label="Cancel">
                        <X className="size-4" />
                    </Button>
                </div>
            );
        }
        return <span className={canManage ? "cursor-cell" : undefined}>{displayVal || "—"}</span>;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>First name (account)</TableHead>
                        <TableHead>Last name (account)</TableHead>
                        <TableHead>Last logon</TableHead>
                        <TableHead>Class number</TableHead>
                        <TableHead>First name (class)</TableHead>
                        <TableHead>Last name (class)</TableHead>
                        <TableHead>Gender (class)</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Guardians</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => {
                        const roster = rosterByStudentId.get(student.id) ?? null;
                        const displayName = displayNameForStudent(student, roster);
                        const initials = displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                        const guardianNames = guardianNamesByStudentId.get(student.id) ?? [];
                        const guardianNamesStr = guardianNames.length > 0 ? guardianNames.join(", ") : "—";
                        const lastLogonStr = student.lastLogon
                            ? format(new Date(student.lastLogon), "MMM d, yyyy")
                            : "—";
                        return (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={student.avatarURL || student.imageURL} />
                                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{displayName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {student.firstName || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {student.lastName || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                    {lastLogonStr}
                                </TableCell>
                                <TableCell
                                    className="text-muted-foreground tabular-nums"
                                    onDoubleClick={canManage ? () => handleStartEdit(student.id, "roster.number", roster) : undefined}
                                >
                                    {renderEditableCell(student.id, "roster.number", roster?.number != null ? String(roster.number) : "")}
                                </TableCell>
                                <TableCell
                                    className="text-muted-foreground"
                                    onDoubleClick={canManage ? () => handleStartEdit(student.id, "roster.firstName", roster) : undefined}
                                >
                                    {renderEditableCell(student.id, "roster.firstName", roster?.firstName || "")}
                                </TableCell>
                                <TableCell
                                    className="text-muted-foreground"
                                    onDoubleClick={canManage ? () => handleStartEdit(student.id, "roster.lastName", roster) : undefined}
                                >
                                    {renderEditableCell(student.id, "roster.lastName", roster?.lastName || "")}
                                </TableCell>
                                <TableCell
                                    className="text-muted-foreground"
                                    onDoubleClick={canManage ? () => handleStartEdit(student.id, "roster.gender", roster) : undefined}
                                >
                                    {renderEditableCell(student.id, "roster.gender", getGenderLabel(roster?.gender))}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {student.email || "—"}
                                </TableCell>
                                <TableCell
                                    className="text-muted-foreground max-w-[200px] align-top"
                                    onDoubleClick={canManage ? () => setManageGuardiansForStudent(student) : undefined}
                                >
                                    <span className={canManage ? "cursor-cell line-clamp-2 whitespace-normal" : "line-clamp-2 whitespace-normal"} title={guardianNamesStr}>
                                        {guardianNamesStr}
                                    </span>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            {manageGuardiansForStudent && (
                <ManageGuardiansDialog
                    student={manageGuardiansForStudent}
                    classGuardians={classGuardians}
                    open={!!manageGuardiansForStudent}
                    onOpenChange={(open) => {
                        if (!open) setManageGuardiansForStudent(null);
                    }}
                />
            )}
        </div>
    );
}

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const [view, setView] = useState<"grid" | "table">("grid");
    
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
    const studentIds = students.map((s) => s.id);
    const { data: guardiansData } = db.useQuery(
        studentIds.length > 0
            ? { $users: { $: { where: { id: { $in: studentIds } } }, guardians: {} } }
            : null
    );
    const guardianNamesByStudentId = useMemo(() => {
        const m = new Map<string, string[]>();
        type Guardian = { id?: string; firstName?: string; lastName?: string; email?: string };
        const list =
            (guardiansData as { $users?: { id: string; guardians?: Guardian[] }[] } | undefined)
                ?.$users ?? [];
        for (const u of list) {
            const names = (u.guardians ?? []).map((g) => {
                const full = `${g.firstName ?? ""} ${g.lastName ?? ""}`.trim();
                return full || g.email || "Unknown";
            });
            m.set(u.id, names);
        }
        return m;
    }, [(guardiansData as { $users?: unknown[] } | undefined)?.$users]);

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
                    <div className="flex items-center gap-1">
                        <Button
                            variant={view === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setView("grid")}
                            aria-label="Grid view"
                        >
                            <LayoutGrid className="size-4" />
                        </Button>
                        <Button
                            variant={view === "table" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setView("table")}
                            aria-label="Table view"
                        >
                            <Table2 className="size-4" />
                        </Button>
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
                                        {view === "table" && canManage && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Double click a cell to edit it.
                                            </p>
                                        )}
                                    </div>
                                    {view === "grid" ? (
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
                                    ) : (
                                        <StudentsTable
                                            students={students}
                                            canManage={canManage}
                                            classId={classId}
                                            rosterByStudentId={rosterByStudentId}
                                            guardianNamesByStudentId={guardianNamesByStudentId}
                                            classGuardians={guardians}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </RestrictedRoute>
    );
}
