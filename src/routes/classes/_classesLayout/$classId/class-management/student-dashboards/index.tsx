/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { UserCircle, Settings, Eye } from "lucide-react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/class-management/student-dashboards/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("settings");

    const students = classEntity?.classStudents || [];

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserCircle className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Student Dashboards
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Preview and configure student dashboard views
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile/Tablet: Tabs layout (md and smaller) */}
                <div className="block lg:hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="settings" className="gap-2">
                                <Settings className="size-4" />
                                Settings
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="gap-2">
                                <Eye className="size-4" />
                                Preview
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="settings" className="mt-4">
                            <SettingsPanel />
                        </TabsContent>

                        <TabsContent value="preview" className="mt-4">
                            <PreviewPanel
                                students={students}
                                selectedStudentId={selectedStudentId}
                                onStudentSelect={setSelectedStudentId}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Desktop: Side-by-side layout (lg and bigger) */}
                <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings className="size-5" />
                            <h2 className="text-lg font-semibold">Settings</h2>
                        </div>
                        <SettingsPanel />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Eye className="size-5" />
                            <h2 className="text-lg font-semibold">Preview</h2>
                        </div>
                        <PreviewPanel
                            students={students}
                            selectedStudentId={selectedStudentId}
                            onStudentSelect={setSelectedStudentId}
                        />
                    </div>
                </div>
            </div>
        </RestrictedRoute>
    );
}

function SettingsPanel() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Dashboard Settings</CardTitle>
                <CardDescription>
                    Configure what students see on their dashboard
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Display Options</Label>
                    <p className="text-sm text-muted-foreground">
                        Configure dashboard display settings for students
                    </p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label>Widget Configuration</Label>
                    <p className="text-sm text-muted-foreground">
                        Manage which widgets appear on student dashboards
                    </p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label>Privacy Settings</Label>
                    <p className="text-sm text-muted-foreground">
                        Control what information students can see about themselves and others
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function PreviewPanel({
    students,
    selectedStudentId,
    onStudentSelect,
}: {
    students: Array<{ id: string; firstName?: string | null; lastName?: string | null; email?: string | null }>;
    selectedStudentId: string;
    onStudentSelect: (id: string) => void;
}) {
    const selectedStudent = students.find((s) => s.id === selectedStudentId);
    const displayName = selectedStudent
        ? `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() || selectedStudent.email || "Unknown Student"
        : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Preview</CardTitle>
                <CardDescription>
                    Select a student to preview their dashboard view
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="student-select">Select Student</Label>
                    <Select
                        value={selectedStudentId}
                        onValueChange={onStudentSelect}
                    >
                        <SelectTrigger id="student-select">
                            <SelectValue placeholder="Choose a student to preview" />
                        </SelectTrigger>
                        <SelectContent>
                            {students.length === 0 ? (
                                <SelectItem value="" disabled>
                                    No students available
                                </SelectItem>
                            ) : (
                                students.map((student) => {
                                    const studentDisplayName =
                                        `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
                                        student.email ||
                                        "Unknown Student";
                                    return (
                                        <SelectItem key={student.id} value={student.id}>
                                            {studentDisplayName}
                                        </SelectItem>
                                    );
                                })
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {selectedStudentId && displayName ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/50 p-6 min-h-[400px]">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        Preview: {displayName}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        This is how the dashboard appears to {displayName}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-32 rounded border bg-background p-4">
                                        <p className="text-sm text-muted-foreground">
                                            Dashboard content will appear here
                                        </p>
                                    </div>
                                    <div className="h-32 rounded border bg-background p-4">
                                        <p className="text-sm text-muted-foreground">
                                            Additional dashboard widgets
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-muted/50 p-12 text-center">
                        <Eye className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                            Select a student above to preview their dashboard
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
