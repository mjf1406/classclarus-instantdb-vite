/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { UserPlus, RefreshCw, Check } from "lucide-react";
import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "../../../-components/navigation/use-class-role";
import { generateJoinCode } from "@/lib/invite-utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StudentIcon, TeacherIcon, ParentIcon } from "@/components/icons/role-icons";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/invite/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading: classLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    // Query for class join codes
    const joinCodeQuery = classId
        ? {
              classes: {
                  $: {
                      where: { id: classId },
                  },
                  joinCodeEntity: {},
              },
          }
        : null;

    const { data: joinCodeData, isLoading: codeLoading } = db.useQuery(joinCodeQuery);
    const joinCodeEntity = joinCodeData?.classes?.[0]?.joinCodeEntity;

    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState<{
        student: boolean;
        teacher: boolean;
        parent: boolean;
    }>({
        student: false,
        teacher: false,
        parent: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<{
        student: boolean;
        teacher: boolean;
        parent: boolean;
    }>({
        student: false,
        teacher: false,
        parent: false,
    });

    const isLoading = classLoading || codeLoading;
    const hasPermission = roleInfo.isOwner || roleInfo.isAdmin;

    const handleGenerateCodes = async () => {
        if (!classId) return;

        setIsGenerating(true);
        setError(null);

        try {
            const codeId = id();
            const studentCode = generateJoinCode();
            const teacherCode = generateJoinCode();
            const parentCode = generateJoinCode();

            db.transact([
                db.tx.classJoinCodes[codeId].create({
                    studentCode,
                    teacherCode,
                    parentCode,
                }),
                db.tx.classes[classId].link({ joinCodeEntity: codeId }),
            ]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to generate join codes. Please try again."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateCode = async (type: "student" | "teacher" | "parent") => {
        if (!classId || !joinCodeEntity?.id) return;

        setIsRegenerating((prev) => ({ ...prev, [type]: true }));
        setError(null);

        try {
            const newCode = generateJoinCode();
            const updateData: any = {};
            if (type === "student") {
                updateData.studentCode = newCode;
            } else if (type === "teacher") {
                updateData.teacherCode = newCode;
            } else {
                updateData.parentCode = newCode;
            }

            db.transact([db.tx.classJoinCodes[joinCodeEntity.id].update(updateData)]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to regenerate join code. Please try again."
            );
        } finally {
            setIsRegenerating((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleCopySuccess = (type: "student" | "teacher" | "parent") => {
        setCopySuccess((prev) => ({ ...prev, [type]: true }));
        setTimeout(() => {
            setCopySuccess((prev) => ({ ...prev, [type]: false }));
        }, 2000);
    };

    if (!hasPermission) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlus className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Invite Members
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Invite new members to your class
                            </p>
                        </div>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-6">
                        <p className="text-sm text-muted-foreground text-center">
                            You don't have permission to invite members. Only
                            class owners and admins can manage join codes.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const codes = joinCodeEntity
        ? {
              student: joinCodeEntity.studentCode || null,
              teacher: joinCodeEntity.teacherCode || null,
              parent: joinCodeEntity.parentCode || null,
          }
        : { student: null, teacher: null, parent: null };

    const CodeCard = ({
        type,
        code,
        icon: Icon,
        title,
        description,
    }: {
        type: "student" | "teacher" | "parent";
        code: string | null;
        icon: React.ComponentType<{ className?: string }>;
        title: string;
        description: string;
    }) => (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Icon className="size-5 text-primary" />
                    <CardTitle>{title} Code</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {code ? (
                    <>
                        <div className="flex items-center gap-3">
                            <Badge
                                variant="outline"
                                className="text-2xl font-mono px-4 py-2 tracking-wider"
                            >
                                {code}
                            </Badge>
                            <CopyButton
                                textToCopy={code}
                                onCopySuccess={() => handleCopySuccess(type)}
                                variant="outline"
                                size="default"
                            >
                                {copySuccess[type] ? (
                                    <>
                                        <Check className="size-4" />
                                        Copied!
                                    </>
                                ) : (
                                    "Copy"
                                )}
                            </CopyButton>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isRegenerating[type]}
                                    size="sm"
                                >
                                    <RefreshCw
                                        className={`size-4 mr-2 ${
                                            isRegenerating[type]
                                                ? "animate-spin"
                                                : ""
                                        }`}
                                    />
                                    Regenerate
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Regenerate {title} Code?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will invalidate the current {title.toLowerCase()}{" "}
                                        code and generate a new one. Users who haven't joined yet
                                        will need the new code to join.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleRegenerateCode(type)}
                                        disabled={isRegenerating[type]}
                                    >
                                        {isRegenerating[type]
                                            ? "Regenerating..."
                                            : "Regenerate"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No {title.toLowerCase()} code generated yet.
                    </p>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserPlus className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Invite Members
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Generate and share join codes to invite members to your class
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardContent className="py-4">
                        <p className="text-sm text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : joinCodeEntity ? (
                <div className="space-y-4">
                    <CodeCard
                        type="student"
                        code={codes.student}
                        icon={StudentIcon}
                        title="Student"
                        description="Share this code with students to join the class"
                    />
                    <CodeCard
                        type="teacher"
                        code={codes.teacher}
                        icon={TeacherIcon}
                        title="Teacher"
                        description="Share this code with teachers to join the class"
                    />
                    <CodeCard
                        type="parent"
                        code={codes.parent}
                        icon={ParentIcon}
                        title="Parent"
                        description="Share this code with parents to join the class"
                    />
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Join Codes</CardTitle>
                        <CardDescription>
                            Create join codes for students, teachers, and parents to
                            invite them to your class. Users can enter these codes on the
                            join page to join.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleGenerateCodes}
                            disabled={isGenerating}
                            size="lg"
                            className="w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="size-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="size-4 mr-2" />
                                    Generate Join Codes
                                </>
                            )}
                        </Button>

                        <div className="pt-4 border-t space-y-2">
                            <h3 className="text-sm font-medium">How it works:</h3>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>
                                    Generate unique 6-character codes for students,
                                    teachers, and parents
                                </li>
                                <li>Share the appropriate code with users you want to invite</li>
                                <li>
                                    Users enter the code on the{" "}
                                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                                        /join
                                    </code>{" "}
                                    page
                                </li>
                                <li>
                                    After joining, users will be added to the class with
                                    the appropriate role
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
