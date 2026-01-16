/** @format */

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface ClassNoClassesProps {
    createClassButton?: React.ReactNode;
    createOrgButton?: React.ReactNode;
    joinClassButton?: React.ReactNode;
    joinOrgButton?: React.ReactNode;
}

export function ClassNoClasses({
    createClassButton,
    createOrgButton = false,
    joinClassButton,
    joinOrgButton,
}: ClassNoClassesProps) {
    const hasActions =
        createClassButton ||
        createOrgButton ||
        joinClassButton ||
        joinOrgButton;

    return (
        <Card className="border-dashed max-w-md space-y-4 mx-auto">
            <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-center">
                    <BookOpen className="size-24 text-muted-foreground" />
                </div>
                <CardTitle>No classes yet</CardTitle>
                <CardDescription>
                    <div className="max-w-sm mx-auto">
                        Classes are where you organize your students,
                        assignments, and course materials. Create your first
                        class to get started.
                    </div>
                </CardDescription>
            </CardHeader>
            {hasActions && (
                <CardFooter className="flex flex-col gap-2">
                    {createClassButton && (
                        <div className="w-full">{createClassButton}</div>
                    )}
                    <div className="flex gap-2 w-full">
                        {joinClassButton && (
                            <div className="flex-1">{joinClassButton}</div>
                        )}
                        {joinOrgButton && (
                            <div className="flex-1">{joinOrgButton}</div>
                        )}
                    </div>
                    {createOrgButton && (
                        <div className="w-full">{createOrgButton}</div>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
