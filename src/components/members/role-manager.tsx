/** @format */

import { useState, useEffect } from "react";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
    getGuardianLinkTransactions,
    ensureStudentHasGuardianCode,
} from "@/lib/guardian-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Settings2 } from "lucide-react";
import {
    AdminBadge,
    TeacherBadge,
    AssistantTeacherBadge,
    StudentBadge,
    GuardianBadge,
    AdminIcon,
    TeacherIcon,
    AssistantTeacherIcon,
    StudentIcon,
    GuardianIcon,
} from "@/components/icons/role-icons";

type User = InstaQLEntity<AppSchema, "$users">;

type ClassWithRoles = InstaQLEntity<
    AppSchema,
    "classes",
    {
        owner: {};
        classAdmins: {};
        classTeachers: {};
        classAssistantTeachers: {};
        classStudents: {};
        classGuardians: {};
    }
>;

type OrgWithRoles = InstaQLEntity<
    AppSchema,
    "organizations",
    {
        owner: {};
        admins: {};
        orgTeachers: {};
    }
>;

type ClassQueryResult = {
    classes: ClassWithRoles[];
};

type OrgQueryResult = {
    organizations: OrgWithRoles[];
};

type RoleType =
    | "admin"
    | "teacher"
    | "assistant-teacher"
    | "student"
    | "guardian";

interface RoleManagerProps {
    user: User;
    contextType: "class" | "org";
    contextId: string;
    canManage: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}

export function RoleManager({
    user,
    contextType,
    contextId,
    open: openProp,
    onOpenChange: onOpenChangeProp,
    hideTrigger = false,
}: RoleManagerProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = openProp !== undefined && onOpenChangeProp !== undefined;
    const dialogOpen = isControlled ? openProp : internalOpen;
    const [selectedRoles, setSelectedRoles] = useState<Set<RoleType>>(
        new Set()
    );
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user: currentUser } = useAuthContext();

    // Query user's current roles in the context
    const classQuery =
        contextType === "class"
            ? {
                  classes: {
                      $: { where: { id: contextId } },
                      owner: {},
                      classAdmins: {},
                      classTeachers: {},
                      classAssistantTeachers: {},
                      classStudents: {},
                      classGuardians: {},
                  },
              }
            : null;

    const orgQuery =
        contextType === "org"
            ? {
                  organizations: {
                      $: { where: { id: contextId } },
                      owner: {},
                      admins: {},
                      orgTeachers: {},
                  },
              }
            : null;

    const { data: classData } = db.useQuery(classQuery);
    const { data: orgData } = db.useQuery(orgQuery);

    const typedClassData = (classData as ClassQueryResult | undefined) ?? null;
    const typedOrgData = (orgData as OrgQueryResult | undefined) ?? null;

    const classEntity = typedClassData?.classes?.[0];
    const orgEntity = typedOrgData?.organizations?.[0];

    // Check if current user is owner
    const isCurrentUserOwner =
        (contextType === "class" &&
            classEntity?.owner?.id === currentUser?.id) ||
        (contextType === "org" && orgEntity?.owner?.id === currentUser?.id);

    // Check if the user being managed is an admin
    const isManagedUserAdmin =
        (contextType === "class" &&
            classEntity?.classAdmins?.some((a) => a.id === user.id)) ||
        (contextType === "org" &&
            orgEntity?.admins?.some((a) => a.id === user.id));

    // Check if current user is a student, guardian, or assistant teacher (restricted role)
    const isCurrentUserStudent =
        contextType === "class" &&
        classEntity?.classStudents?.some((s) => s.id === currentUser?.id);
    const isCurrentUserGuardian =
        contextType === "class" &&
        classEntity?.classGuardians?.some((g) => g.id === currentUser?.id);
    const isCurrentUserAssistantTeacher =
        contextType === "class" &&
        classEntity?.classAssistantTeachers?.some((at) => at.id === currentUser?.id);
    const isCurrentUserRestricted = isCurrentUserStudent || isCurrentUserGuardian || isCurrentUserAssistantTeacher;

    // If managed user is an admin and current user is not owner, don't allow role changes
    // Also, students, guardians, and assistant teachers should never see the manage roles button
    const canChangeRoles = !isCurrentUserRestricted && (!isManagedUserAdmin || isCurrentUserOwner);

    // Get current roles
    const currentRoles = new Set<RoleType>();
    let isStudent = false;

    if (contextType === "class" && classEntity) {
        if (classEntity.classAdmins?.some((a) => a.id === user.id)) {
            currentRoles.add("admin");
        }
        if (classEntity.classTeachers?.some((t) => t.id === user.id)) {
            currentRoles.add("teacher");
        }
        if (
            classEntity.classAssistantTeachers?.some(
                (at) => at.id === user.id
            )
        ) {
            currentRoles.add("assistant-teacher");
        }
        if (classEntity.classStudents?.some((s) => s.id === user.id)) {
            currentRoles.add("student");
            isStudent = true;
        }
        if (classEntity.classGuardians?.some((g) => g.id === user.id)) {
            currentRoles.add("guardian");
        }
    } else if (contextType === "org" && orgEntity) {
        if (orgEntity.admins?.some((a) => a.id === user.id)) {
            currentRoles.add("admin");
        }
        if (orgEntity.orgTeachers?.some((t) => t.id === user.id)) {
            currentRoles.add("teacher");
        }
        // For org context, check if user is a student in any class within the org
        // We'll need to query classes to check this
    }

    // Query to check if user is a student in any class within the org
    const orgStudentCheckQuery =
        contextType === "org"
            ? {
                  classes: {
                      $: {
                          where: {
                              and: [
                                  { "organization.id": contextId },
                                  { "classStudents.id": user.id },
                              ],
                          },
                      },
                  },
              }
            : null;

    const { data: orgStudentData } = db.useQuery(orgStudentCheckQuery);
    if (contextType === "org" && orgStudentData) {
        const classes = (orgStudentData as { classes: unknown[] })?.classes || [];
        if (classes.length > 0) {
            isStudent = true;
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (onOpenChangeProp) onOpenChangeProp(newOpen);
        if (!isControlled) setInternalOpen(newOpen);
    };

    useEffect(() => {
        if (dialogOpen) {
            setSelectedRoles(new Set(currentRoles));
            setError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- currentRoles is derived, we only need to init when dialog opens
    }, [dialogOpen]);

    // Get available roles based on user type
    // Students can switch to other roles, but if they have student role, they can only have student role
    const getAvailableRoles = (): RoleType[] => {
        if (contextType === "class") {
            return ["admin", "teacher", "assistant-teacher", "guardian", "student"];
        } else {
            return ["admin", "teacher"];
        }
    };

    const availableRoles = getAvailableRoles();

    const handleRoleToggle = (role: RoleType) => {
        const newSelected = new Set(selectedRoles);
        if (newSelected.has(role)) {
            newSelected.delete(role);
        } else {
            // If adding student role, remove all other roles
            if (role === "student") {
                newSelected.clear();
                newSelected.add("student");
            } else {
                // If adding non-student role, remove student role
                newSelected.delete("student");
                newSelected.add(role);
            }
        }
        setSelectedRoles(newSelected);
    };

    const handleSave = async () => {
        setIsUpdating(true);
        setError(null);

        try {
            // Calculate roles to add (in selected but not in current)
            const rolesToAdd = new Set<RoleType>();
            selectedRoles.forEach((role) => {
                if (!currentRoles.has(role)) {
                    rolesToAdd.add(role);
                }
            });

            // Calculate roles to remove (in current but not in selected)
            const rolesToRemove = new Set<RoleType>();
            currentRoles.forEach((role) => {
                if (!selectedRoles.has(role)) {
                    rolesToRemove.add(role);
                }
            });

            const transactions: Parameters<typeof db.transact>[0][] = [];

            if (contextType === "class") {
                // Remove roles
                if (rolesToRemove.has("admin")) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classAdmins: user.id,
                        })
                    );
                }
                if (rolesToRemove.has("teacher")) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classTeachers: user.id,
                        })
                    );
                }
                if (rolesToRemove.has("assistant-teacher")) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classAssistantTeachers: user.id,
                        })
                    );
                }
                if (rolesToRemove.has("student")) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classStudents: user.id,
                        })
                    );
                }
                if (rolesToRemove.has("guardian")) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classGuardians: user.id,
                        })
                    );
                }

                // Add roles
                if (rolesToAdd.has("admin")) {
                    transactions.push(
                        db.tx.classes[contextId].link({
                            classAdmins: user.id,
                        })
                    );
                }
                if (rolesToAdd.has("teacher")) {
                    transactions.push(
                        db.tx.classes[contextId].link({
                            classTeachers: user.id,
                        })
                    );
                }
                if (rolesToAdd.has("assistant-teacher")) {
                    transactions.push(
                        db.tx.classes[contextId].link({
                            classAssistantTeachers: user.id,
                        })
                    );
                }
                if (rolesToAdd.has("student")) {
                    transactions.push(
                        db.tx.classes[contextId].link({
                            classStudents: user.id,
                        })
                    );
                    // Ensure student has a guardian code
                    try {
                        await ensureStudentHasGuardianCode(db, user.id);
                    } catch (error) {
                        console.error(
                            `[Role Manager] Error ensuring guardian code for student ${user.id}:`,
                            error
                        );
                        // Don't fail the role assignment if code generation fails
                    }
                }
                if (rolesToAdd.has("guardian")) {
                    transactions.push(
                        db.tx.classes[contextId].link({
                            classGuardians: user.id,
                        })
                    );
                }
            } else {
                // Organization context
                if (rolesToRemove.has("admin")) {
                    transactions.push(
                        db.tx.organizations[contextId].unlink({
                            admins: user.id,
                        })
                    );
                }
                if (rolesToRemove.has("teacher")) {
                    transactions.push(
                        db.tx.organizations[contextId].unlink({
                            orgTeachers: user.id,
                        })
                    );
                }

                if (rolesToAdd.has("admin")) {
                    transactions.push(
                        db.tx.organizations[contextId].link({
                            admins: user.id,
                        })
                    );
                }
                if (rolesToAdd.has("teacher")) {
                    transactions.push(
                        db.tx.organizations[contextId].link({
                            orgTeachers: user.id,
                        })
                    );
                }
            }

            // If student role is being added, also add their guardians to the class
            if (contextType === "class" && rolesToAdd.has("student")) {
                const guardianTransactions =
                    await getGuardianLinkTransactions(
                        db,
                        user.id,
                        contextId
                    );
                transactions.push(...guardianTransactions);
            }

            if (transactions.length > 0) {
                await db.transact(transactions as Parameters<typeof db.transact>[0]);
            }

            handleOpenChange(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update roles"
            );
        } finally {
            setIsUpdating(false);
        }
    };

    const renderRoleBadge = (role: RoleType) => {
        switch (role) {
            case "admin":
                return <AdminBadge />;
            case "teacher":
                return <TeacherBadge />;
            case "assistant-teacher":
                return <AssistantTeacherBadge />;
            case "student":
                return <StudentBadge />;
            case "guardian":
                return <GuardianBadge />;
        }
    };

    const renderDialogRoleBadge = (role: RoleType) => {
        const baseClasses = "gap-1 text-white";
        const iconClasses = "size-3 text-white";
        switch (role) {
            case "admin":
                return (
                    <Badge
                        className={`${baseClasses} bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500`}
                    >
                        <AdminIcon className={iconClasses} />
                        Admin
                    </Badge>
                );
            case "teacher":
                return (
                    <Badge
                        className={`${baseClasses} bg-purple-600 dark:bg-purple-500 border-purple-600 dark:border-purple-500`}
                    >
                        <TeacherIcon className={iconClasses} />
                        Teacher
                    </Badge>
                );
            case "assistant-teacher":
                return (
                    <Badge
                        className={`${baseClasses} bg-cyan-600 dark:bg-cyan-500 border-cyan-600 dark:border-cyan-500`}
                    >
                        <AssistantTeacherIcon className={iconClasses} />
                        Assistant Teacher
                    </Badge>
                );
            case "student":
                return (
                    <Badge
                        className={`${baseClasses} bg-green-600 dark:bg-green-500 border-green-600 dark:border-green-500`}
                    >
                        <StudentIcon className={iconClasses} />
                        Student
                    </Badge>
                );
            case "guardian":
                return (
                    <Badge
                        className={`${baseClasses} bg-pink-600 dark:bg-pink-500 border-pink-600 dark:border-pink-500`}
                    >
                        <GuardianIcon className={iconClasses} />
                        Guardian
                    </Badge>
                );
        }
    };

    // If managed user is an admin and current user is not owner, only show badges
    if (!canChangeRoles) {
        return (
            <div className="flex flex-wrap gap-2">
                {Array.from(currentRoles).map((role) => (
                    <div key={role}>{renderRoleBadge(role)}</div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {Array.from(currentRoles).map((role) => (
                    <div key={role}>{renderRoleBadge(role)}</div>
                ))}
            </div>
            <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
                {!hideTrigger && (
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Settings2 className="size-4 mr-2" />
                            Manage Roles
                        </Button>
                    </DialogTrigger>
                )}
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Roles</DialogTitle>
                        <DialogDescription>
                            {isStudent
                                ? "This user is a student and can only have the student role."
                                : "Select roles for this user. Non-students can have multiple roles."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Field>
                            <FieldLabel>Roles</FieldLabel>
                            <FieldContent>
                                <div className="space-y-2">
                                    {availableRoles.map((role) => {
                                        const isSelected =
                                            selectedRoles.has(role);
                                        return (
                                            <label
                                                key={role}
                                                className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        handleRoleToggle(role)
                                                    }
                                                    className="rounded"
                                                />
                                                <span className="flex-1">
                                                    {renderDialogRoleBadge(role)}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {error && <FieldError>{error}</FieldError>}
                                <FieldDescription>
                                    {isStudent
                                        ? "Students can only have the student role."
                                        : "You can select multiple roles for this user."}
                                </FieldDescription>
                            </FieldContent>
                        </Field>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
