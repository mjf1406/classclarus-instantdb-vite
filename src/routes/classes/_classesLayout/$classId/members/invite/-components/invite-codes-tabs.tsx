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
import { Copy, Check, Link, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateGuardianCodePDF } from "@/lib/guardian-pdf-export";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface InviteCodesTabsProps {
    codes: {
        student: string | null;
        teacher: string | null;
        guardian: string | null;
    };
    studentGuardianCodes?: Array<{
        studentId: string;
        studentName: string;
        code: string | null;
        guardianCount: number;
    }>;
    isLoading?: boolean;
    onCopySuccess?: (type: "student" | "teacher" | "guardian") => void;
    classId?: string;
    className?: string;
}

export function InviteCodesTabs({
    codes,
    studentGuardianCodes = [],
    isLoading = false,
    onCopySuccess,
    classId,
    className,
}: InviteCodesTabsProps) {
    const [activeTab, setActiveTab] = useState<string>("");
    const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
    const [copiedLinkStudentId, setCopiedLinkStudentId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!classId || !className || studentGuardianCodes.length === 0) {
            return;
        }

        setIsExporting(true);
        try {
            await generateGuardianCodePDF(
                studentGuardianCodes,
                classId,
                className
            );
        } catch (error) {
            console.error("Failed to export PDF:", error);
        } finally {
            setIsExporting(false);
        }
    };

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
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <GuardianIcon className="size-5 text-primary" />
                                    <CardTitle>Guardian Codes</CardTitle>
                                </div>
                                <CardDescription>
                                    Each student has a unique code for their parents to join as guardians. Share the appropriate code with each student's parents.
                                </CardDescription>
                            </div>
                            {studentGuardianCodes.length > 0 && classId && className && (
                                <Button
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Download className="size-4 mr-2" />
                                    {isExporting ? "Generating..." : "Download PDF"}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {studentGuardianCodes.length > 0 ? (
                            <div className="space-y-4">
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Guardian Code</TableHead>
                                                <TableHead>Guardians</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {studentGuardianCodes.map((item) => (
                                                <TableRow key={item.studentId}>
                                                    <TableCell className="font-medium">
                                                        {item.studentName}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.code ? (
                                                            <div className="flex items-center gap-2">
                                                                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                                                                    {item.code}
                                                                </code>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={async () => {
                                                                            try {
                                                                                await navigator.clipboard.writeText(item.code!);
                                                                                setCopiedStudentId(item.studentId);
                                                                                setTimeout(() => setCopiedStudentId(null), 1500);
                                                                            } catch (error) {
                                                                                console.error("Failed to copy:", error);
                                                                            }
                                                                        }}
                                                                        title={copiedStudentId === item.studentId ? "Copied!" : "Copy code"}
                                                                    >
                                                                        {copiedStudentId === item.studentId ? (
                                                                            <Check className="size-4 text-green-500" />
                                                                        ) : (
                                                                            <Copy className="size-4" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const link = `${window.location.origin}/join/class?code=${item.code}`;
                                                                                await navigator.clipboard.writeText(link);
                                                                                setCopiedLinkStudentId(item.studentId);
                                                                                setTimeout(() => setCopiedLinkStudentId(null), 1500);
                                                                            } catch (error) {
                                                                                console.error("Failed to copy link:", error);
                                                                            }
                                                                        }}
                                                                        title={copiedLinkStudentId === item.studentId ? "Link copied!" : "Copy link"}
                                                                    >
                                                                        {copiedLinkStudentId === item.studentId ? (
                                                                            <Check className="size-4 text-green-500" />
                                                                        ) : (
                                                                            <Link className="size-4" />
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">
                                                                Not generated
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            {item.guardianCount}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    No students in this class yet. Guardian codes are automatically generated when students join the class.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
