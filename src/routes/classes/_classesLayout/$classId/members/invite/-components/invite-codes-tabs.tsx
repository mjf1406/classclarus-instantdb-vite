/** @format */

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    StudentIcon,
    TeacherIcon,
    GuardianIcon,
} from "@/components/icons/role-icons";
import { CopyJoinUrlButton } from "./copy-join-url-button";
import { CopyCodeButton } from "./copy-code-button";
import { OpenCodeInWindowButton } from "./open-code-in-window-button";

interface InviteCodesTabsProps {
    codes: {
        student: string | null;
        teacher: string | null;
        guardian: string | null;
    };
    isLoading?: boolean;
    onCopySuccess?: (type: "student" | "teacher" | "guardian") => void;
}

export function InviteCodesTabs({
    codes,
    isLoading = false,
    onCopySuccess,
}: InviteCodesTabsProps) {
    const [activeTab, setActiveTab] = useState<string>("");

    const handleCopySuccess = (type: "student" | "teacher" | "guardian") => {
        onCopySuccess?.(type);
    };

    const CodeCard = ({
        type,
        code,
        icon: Icon,
        title,
        description,
    }: {
        type: "student" | "teacher" | "guardian";
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
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <CopyJoinUrlButton
                                code={code}
                                onCopySuccess={() => handleCopySuccess(type)}
                            />
                            <CopyCodeButton
                                code={code}
                                onCopySuccess={() => handleCopySuccess(type)}
                            />
                            <OpenCodeInWindowButton
                                code={code}
                                role={type}
                            />
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {title} code is being generated...
                    </p>
                )}
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 mt-2 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student" className="gap-2">
                    <StudentIcon className="size-4" />
                    Student
                </TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2">
                    <TeacherIcon className="size-4" />
                    Teacher
                </TabsTrigger>
                <TabsTrigger value="guardian" className="gap-2">
                    <GuardianIcon className="size-4" />
                    Guardian
                </TabsTrigger>
            </TabsList>

            {activeTab === "" && (
                <Card className="mt-4">
                    <CardContent className="py-12 text-center">
                        <p className="text-lg text-muted-foreground">
                            Select a tab above to view and share the join code
                        </p>
                    </CardContent>
                </Card>
            )}

            <TabsContent value="student" className="mt-4">
                <CodeCard
                    type="student"
                    code={codes.student}
                    icon={StudentIcon}
                    title="Student"
                    description="Share this code with students to join the class"
                />
            </TabsContent>

            <TabsContent value="teacher" className="mt-4">
                <CodeCard
                    type="teacher"
                    code={codes.teacher}
                    icon={TeacherIcon}
                    title="Teacher"
                    description="Share this code with teachers to join the class"
                />
            </TabsContent>

            <TabsContent value="guardian" className="mt-4">
                <CodeCard
                    type="guardian"
                    code={codes.guardian}
                    icon={GuardianIcon}
                    title="Guardian"
                    description="Share this code with guardians to join the class"
                />
            </TabsContent>
        </Tabs>
    );
}
