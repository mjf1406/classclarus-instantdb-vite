/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { id } from "@instantdb/react";
import { UserCircle, Settings, Eye } from "lucide-react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { db } from "@/lib/db/db";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PointsWidget } from "../../main/dashboard/-components/points-widget";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

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

    // Early return if classId is not available
    if (!classId) {
        return null;
    }

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
                <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
                    <div className="space-y-4 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings className="size-5" />
                            <h2 className="text-lg font-semibold">Settings</h2>
                        </div>
                        <SettingsPanel />
                    </div>
                    <div className="space-y-4 lg:col-span-3">
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

type ClassDashboardSettings = InstaQLEntity<AppSchema, "classDashboardSettings", { class?: {} }>;

type DashboardSettingsQueryResult = {
    classDashboardSettings: ClassDashboardSettings[];
};

function SettingsPanel() {
    const params = useParams({ strict: false });
    const classId = params.classId;

    // Query class dashboard settings
    const { data: settingsData } = db.useQuery(
        classId
            ? {
                  classDashboardSettings: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                  },
              }
            : null
    );

    const typedSettingsData = (settingsData as DashboardSettingsQueryResult | undefined) ?? null;
    const existingSettings = typedSettingsData?.classDashboardSettings?.[0];
    const showPointsWidget = existingSettings?.showPointsWidget ?? false;

    const handleTogglePointsWidget = (enabled: boolean) => {
        if (!classId) return;

        const now = new Date();

        if (existingSettings) {
            // Update existing settings
            db.transact([
                db.tx.classDashboardSettings[existingSettings.id].update({
                    showPointsWidget: enabled,
                    updated: now,
                }),
            ]);
        } else {
            // Create new settings
            const settingsId = id();
            db.transact([
                db.tx.classDashboardSettings[settingsId]
                    .create({
                        groupsTeamsDisplay: "groups", // Default value
                        showPointsWidget: enabled,
                        created: now,
                        updated: now,
                    })
                    .link({ class: classId }),
            ]);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Settings</CardTitle>
                    <CardDescription>
                        Configure student dashboard preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3 space-y-0">
                        <Checkbox
                            id="points-widget-toggle"
                            checked={showPointsWidget}
                            onCheckedChange={handleTogglePointsWidget}
                            className="mt-1"
                        />
                        <div className="space-y-1 leading-none">
                            <Label
                                htmlFor="points-widget-toggle"
                                className="text-base font-medium cursor-pointer"
                            >
                                Points Widget
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Show points widget on student dashboards
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
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
    const params = useParams({ strict: false });
    const classId = params.classId;

    const selectedStudent = students.find((s) => s.id === selectedStudentId);
    const displayName = selectedStudent
        ? `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() || selectedStudent.email || "Unknown Student"
        : null;

    // Query class dashboard settings to check if points widget is enabled
    const { data: settingsData } = db.useQuery(
        classId
            ? {
                  classDashboardSettings: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                  },
              }
            : null
    );

    const typedSettingsData = (settingsData as DashboardSettingsQueryResult | undefined) ?? null;
    const existingSettings = typedSettingsData?.classDashboardSettings?.[0];
    const showPointsWidget = existingSettings?.showPointsWidget ?? false;

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
                                <div className="grid grid-cols-1 gap-4">
                                    {showPointsWidget && classId ? (
                                        <PointsWidget classId={classId} studentId={selectedStudentId} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {showPointsWidget
                                                ? "Loading widget..."
                                                : "Points widget is disabled. Enable it in Settings to preview."}
                                        </p>
                                    )}
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
