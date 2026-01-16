/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { UserPlus, Check } from "lucide-react";
import { useState } from "react";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "../../../-components/navigation/use-class-role";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    StudentIcon,
    TeacherIcon,
    ParentIcon,
} from "@/components/icons/role-icons";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/invite/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading: classLoading } =
        useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    // Get codes directly from class entity (already loaded via useClassById)
    const classEntityWithCodes = classEntity;

    const [copySuccess, setCopySuccess] = useState<{
        student: boolean;
        teacher: boolean;
        parent: boolean;
    }>({
        student: false,
        teacher: false,
        parent: false,
    });

    const isLoading = classLoading;
    const hasPermission = roleInfo.isOwner || roleInfo.isAdmin;

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

    const codes = classEntityWithCodes
        ? {
              student: classEntityWithCodes.studentCode || null,
              teacher: classEntityWithCodes.teacherCode || null,
              parent: classEntityWithCodes.parentCode || null,
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
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {title} code is being generated...
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
                            Share join codes to invite members to your class
                        </p>
                    </div>
                </div>
            </div>

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
            ) : (
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
            )}
        </div>
    );
}
