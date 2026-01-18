/** @format */

import { useState } from "react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { db } from "@/lib/db/db";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserX } from "lucide-react";

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
        classRoster: {};
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

interface KickUserDialogProps {
    user: User;
    contextType: "class" | "org";
    contextId: string;
    canKick: boolean;
    children?: React.ReactNode;
    asDropdownItem?: boolean;
    onKick?: () => void;
}

export function KickUserDialog({
    user,
    contextType,
    contextId,
    canKick,
    children,
    asDropdownItem = false,
    onKick,
}: KickUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [isKicking, setIsKicking] = useState(false);

    if (!canKick) {
        return null;
    }

    // Query to get all user's roles in the context
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
                      classRoster: {
                          $: { where: { "student.id": user.id } },
                      },
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

    // Check if user is owner (owners cannot be kicked)
    const isUserOwner =
        (contextType === "class" &&
            classEntity?.owner?.id === user.id) ||
        (contextType === "org" && orgEntity?.owner?.id === user.id);

    if (isUserOwner) {
        return null;
    }

    const displayName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email ||
        "Unknown User";

    const handleKick = async () => {
        setIsKicking(true);

        try {
            const transactions: Parameters<typeof db.transact>[0][] = [];

            if (contextType === "class" && classEntity) {
                // Unlink all roles the user has
                if (
                    classEntity.classAdmins?.some((a) => a.id === user.id)
                ) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classAdmins: user.id,
                        })
                    );
                }
                if (
                    classEntity.classTeachers?.some((t) => t.id === user.id)
                ) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classTeachers: user.id,
                        })
                    );
                }
                if (
                    classEntity.classAssistantTeachers?.some(
                        (at) => at.id === user.id
                    )
                ) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classAssistantTeachers: user.id,
                        })
                    );
                }
                if (
                    classEntity.classStudents?.some((s) => s.id === user.id)
                ) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classStudents: user.id,
                        })
                    );
                    // Delete class_roster rows for this (class, student)
                    const rosterRows = classEntity.classRoster ?? [];
                    for (const row of rosterRows) {
                        if (row?.id) {
                            transactions.push(db.tx.class_roster[row.id].delete());
                        }
                    }
                }
                if (
                    classEntity.classGuardians?.some((g) => g.id === user.id)
                ) {
                    transactions.push(
                        db.tx.classes[contextId].unlink({
                            classGuardians: user.id,
                        })
                    );
                }
            } else if (contextType === "org" && orgEntity) {
                // Unlink all roles the user has
                if (orgEntity.admins?.some((a) => a.id === user.id)) {
                    transactions.push(
                        db.tx.organizations[contextId].unlink({
                            admins: user.id,
                        })
                    );
                }
                if (orgEntity.orgTeachers?.some((t) => t.id === user.id)) {
                    transactions.push(
                        db.tx.organizations[contextId].unlink({
                            orgTeachers: user.id,
                        })
                    );
                }
            }

            if (transactions.length > 0) {
                db.transact(transactions as Parameters<typeof db.transact>[0]);
            }

            setOpen(false);
            onKick?.();
        } catch (err) {
            console.error("Failed to remove user:", err);
        } finally {
            setIsKicking(false);
        }
    };

    if (asDropdownItem) {
        return (
            <>
                <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    <UserX className="size-4" />
                    Remove
                </DropdownMenuItem>
                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove User</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove "{displayName}"
                                from {contextType === "class" ? "this class" : "this organization"}? They will no longer have access.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isKicking}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleKick}
                                disabled={isKicking}
                            >
                                {isKicking ? "Removing..." : "Remove"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    const trigger = children || (
        <Button variant="outline" size="sm">
            <UserX className="size-4 mr-2" />
            Remove
        </Button>
    );

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove User</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove "{displayName}" from{" "}
                        {contextType === "class" ? "this class" : "this organization"}? They will no longer have access.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isKicking}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={handleKick}
                        disabled={isKicking}
                    >
                        {isKicking ? "Removing..." : "Remove"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
