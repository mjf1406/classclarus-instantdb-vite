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
import { Button } from "@/components/ui/button";
import { PointsWidget } from "../../main/dashboard/-components/points-widget";
import { ExpectationsWidget } from "../../main/dashboard/-components/expectations-widget";
import { RandomAssignersWidget } from "../../main/dashboard/-components/random-assigners-widget";
import { RotatingAssignersWidget } from "../../main/dashboard/-components/rotating-assigners-widget";
import { GroupsTeamsWidget } from "../../main/dashboard/-components/groups-teams-widget";
import { useMemo } from "react";
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

type RandomAssigner = InstaQLEntity<AppSchema, "random_assigners", { class: {} }>;
type RotatingAssigner = InstaQLEntity<AppSchema, "rotating_assigners", { class: {} }>;

type RandomAssignersQueryResult = {
    random_assigners: RandomAssigner[];
};

type RotatingAssignersQueryResult = {
    rotating_assigners: RotatingAssigner[];
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

    // Query assigners for selection
    const { data: randomAssignersData } = db.useQuery(
        classId
            ? {
                  random_assigners: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                  },
              }
            : null
    );

    const { data: rotatingAssignersData } = db.useQuery(
        classId
            ? {
                  rotating_assigners: {
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
    const showExpectationsWidget = existingSettings?.showExpectationsWidget ?? false;
    const showRandomAssignersWidget = existingSettings?.showRandomAssignersWidget ?? false;
    const showRotatingAssignersWidget = existingSettings?.showRotatingAssignersWidget ?? false;
    const showGroupsTeamsWidget = existingSettings?.showGroupsTeamsWidget ?? false;

    const typedRandomAssignersData = (randomAssignersData as RandomAssignersQueryResult | undefined) ?? null;
    const randomAssigners = typedRandomAssignersData?.random_assigners || [];

    const typedRotatingAssignersData = (rotatingAssignersData as RotatingAssignersQueryResult | undefined) ?? null;
    const rotatingAssigners = typedRotatingAssignersData?.rotating_assigners || [];

    // Parse selected assigner IDs - default to all if widget is enabled and no selection exists
    const selectedRandomAssignerIds = useMemo(() => {
        if (!existingSettings?.selectedRandomAssignerIds) {
            // If widget is enabled but no selection, default to all assigners
            if (showRandomAssignersWidget && randomAssigners.length > 0) {
                return randomAssigners.map((a) => a.id);
            }
            return null;
        }
        try {
            const parsed = JSON.parse(existingSettings.selectedRandomAssignerIds);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
        } catch {
            // If parsing fails and widget is enabled, default to all
            if (showRandomAssignersWidget && randomAssigners.length > 0) {
                return randomAssigners.map((a) => a.id);
            }
            return null;
        }
    }, [existingSettings?.selectedRandomAssignerIds, showRandomAssignersWidget, randomAssigners]);

    const selectedRotatingAssignerIds = useMemo(() => {
        if (!existingSettings?.selectedRotatingAssignerIds) {
            // If widget is enabled but no selection, default to all assigners
            if (showRotatingAssignersWidget && rotatingAssigners.length > 0) {
                return rotatingAssigners.map((a) => a.id);
            }
            return null;
        }
        try {
            const parsed = JSON.parse(existingSettings.selectedRotatingAssignerIds);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
        } catch {
            // If parsing fails and widget is enabled, default to all
            if (showRotatingAssignersWidget && rotatingAssigners.length > 0) {
                return rotatingAssigners.map((a) => a.id);
            }
            return null;
        }
    }, [existingSettings?.selectedRotatingAssignerIds, showRotatingAssignersWidget, rotatingAssigners]);

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

    const handleToggleExpectationsWidget = (enabled: boolean) => {
        if (!classId) return;

        const now = new Date();

        if (existingSettings) {
            // Update existing settings
            db.transact([
                db.tx.classDashboardSettings[existingSettings.id].update({
                    showExpectationsWidget: enabled,
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
                        showExpectationsWidget: enabled,
                        created: now,
                        updated: now,
                    })
                    .link({ class: classId }),
            ]);
        }
    };

    const handleToggleRandomAssignersWidget = (enabled: boolean) => {
        if (!classId) return;

        const now = new Date();

        if (existingSettings) {
            // Update existing settings
            // If enabling, set all assigners as selected if none are currently selected
            let selectedIds = existingSettings.selectedRandomAssignerIds;
            if (enabled && (!selectedIds || selectedIds.trim() === "")) {
                const allIds = randomAssigners.map((a) => a.id);
                selectedIds = allIds.length > 0 ? JSON.stringify(allIds) : undefined;
            } else if (!enabled) {
                selectedIds = undefined;
            }

            db.transact([
                db.tx.classDashboardSettings[existingSettings.id].update({
                    showRandomAssignersWidget: enabled,
                    selectedRandomAssignerIds: selectedIds,
                    updated: now,
                }),
            ]);
        } else {
            // Create new settings - default to all assigners selected
            const allIds = randomAssigners.map((a) => a.id);
            const selectedIds = allIds.length > 0 ? JSON.stringify(allIds) : undefined;
            const settingsId = id();
            db.transact([
                db.tx.classDashboardSettings[settingsId]
                    .create({
                        groupsTeamsDisplay: "groups", // Default value
                        showRandomAssignersWidget: enabled,
                        selectedRandomAssignerIds: selectedIds,
                        created: now,
                        updated: now,
                    })
                    .link({ class: classId }),
            ]);
        }
    };

    const handleToggleRotatingAssignersWidget = (enabled: boolean) => {
        if (!classId) return;

        const now = new Date();

        if (existingSettings) {
            // Update existing settings
            // If enabling, set all assigners as selected if none are currently selected
            let selectedIds = existingSettings.selectedRotatingAssignerIds;
            if (enabled && (!selectedIds || selectedIds.trim() === "")) {
                const allIds = rotatingAssigners.map((a) => a.id);
                selectedIds = allIds.length > 0 ? JSON.stringify(allIds) : undefined;
            } else if (!enabled) {
                selectedIds = undefined;
            }

            db.transact([
                db.tx.classDashboardSettings[existingSettings.id].update({
                    showRotatingAssignersWidget: enabled,
                    selectedRotatingAssignerIds: selectedIds,
                    updated: now,
                }),
            ]);
        } else {
            // Create new settings - default to all assigners selected
            const allIds = rotatingAssigners.map((a) => a.id);
            const selectedIds = allIds.length > 0 ? JSON.stringify(allIds) : undefined;
            const settingsId = id();
            db.transact([
                db.tx.classDashboardSettings[settingsId]
                    .create({
                        groupsTeamsDisplay: "groups", // Default value
                        showRotatingAssignersWidget: enabled,
                        selectedRotatingAssignerIds: selectedIds,
                        created: now,
                        updated: now,
                    })
                    .link({ class: classId }),
            ]);
        }
    };

    const handleToggleGroupsTeamsWidget = (enabled: boolean) => {
        if (!classId) return;

        const now = new Date();

        if (existingSettings) {
            // Update existing settings
            db.transact([
                db.tx.classDashboardSettings[existingSettings.id].update({
                    showGroupsTeamsWidget: enabled,
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
                        showGroupsTeamsWidget: enabled,
                        created: now,
                        updated: now,
                    })
                    .link({ class: classId }),
            ]);
        }
    };

    const handleUpdateSelectedRandomAssigners = (assignerIds: string[]) => {
        if (!classId || !existingSettings) return;

        const now = new Date();
        // Always save, even if empty (empty means show nothing)
        const idsJson = JSON.stringify(assignerIds);

        db.transact([
            db.tx.classDashboardSettings[existingSettings.id].update({
                selectedRandomAssignerIds: idsJson,
                updated: now,
            }),
        ]);
    };

    const handleUpdateSelectedRotatingAssigners = (assignerIds: string[]) => {
        if (!classId || !existingSettings) return;

        const now = new Date();
        // Always save, even if empty (empty means show nothing)
        const idsJson = JSON.stringify(assignerIds);

        db.transact([
            db.tx.classDashboardSettings[existingSettings.id].update({
                selectedRotatingAssignerIds: idsJson,
                updated: now,
            }),
        ]);
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
                    <div className="flex items-start space-x-3 space-y-0">
                        <Checkbox
                            id="expectations-widget-toggle"
                            checked={showExpectationsWidget}
                            onCheckedChange={handleToggleExpectationsWidget}
                            className="mt-1"
                        />
                        <div className="space-y-1 leading-none">
                            <Label
                                htmlFor="expectations-widget-toggle"
                                className="text-base font-medium cursor-pointer"
                            >
                                Expectations Widget
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Show expectations widget on student dashboards
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0">
                        <Checkbox
                            id="groups-teams-widget-toggle"
                            checked={showGroupsTeamsWidget}
                            onCheckedChange={handleToggleGroupsTeamsWidget}
                            className="mt-1"
                        />
                        <div className="space-y-1 leading-none">
                            <Label
                                htmlFor="groups-teams-widget-toggle"
                                className="text-base font-medium cursor-pointer"
                            >
                                Groups & Teams Widget
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Show groups and teams widget on student dashboards
                            </p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3 space-y-0">
                            <Checkbox
                                id="random-assigners-widget-toggle"
                                checked={showRandomAssignersWidget}
                                onCheckedChange={handleToggleRandomAssignersWidget}
                                className="mt-1"
                            />
                            <div className="space-y-1 leading-none flex-1">
                                <Label
                                    htmlFor="random-assigners-widget-toggle"
                                    className="text-base font-medium cursor-pointer"
                                >
                                    Random Assigners Widget
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show random assigner history on student dashboards
                                </p>
                            </div>
                        </div>
                        {showRandomAssignersWidget && randomAssigners.length > 0 && (
                            <div className="ml-8 space-y-2 pl-4 border-l-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        Select Assigners
                                    </Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const allIds = randomAssigners.map((a) => a.id);
                                                handleUpdateSelectedRandomAssigners(allIds);
                                            }}
                                        >
                                            Check All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                handleUpdateSelectedRandomAssigners([]);
                                            }}
                                        >
                                            Uncheck All
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {randomAssigners.map((assigner) => {
                                        const isSelected = selectedRandomAssignerIds?.includes(assigner.id) ?? false;
                                        return (
                                            <div key={assigner.id} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`random-assigner-${assigner.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => {
                                                        const currentIds = selectedRandomAssignerIds || [];
                                                        const newIds = checked
                                                            ? [...currentIds, assigner.id]
                                                            : currentIds.filter((id) => id !== assigner.id);
                                                        handleUpdateSelectedRandomAssigners(newIds);
                                                    }}
                                                    className="mt-1"
                                                />
                                                <Label
                                                    htmlFor={`random-assigner-${assigner.id}`}
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {assigner.name}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3 space-y-0">
                            <Checkbox
                                id="rotating-assigners-widget-toggle"
                                checked={showRotatingAssignersWidget}
                                onCheckedChange={handleToggleRotatingAssignersWidget}
                                className="mt-1"
                            />
                            <div className="space-y-1 leading-none flex-1">
                                <Label
                                    htmlFor="rotating-assigners-widget-toggle"
                                    className="text-base font-medium cursor-pointer"
                                >
                                    Rotating Assigners Widget
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show rotating assigner history on student dashboards
                                </p>
                            </div>
                        </div>
                        {showRotatingAssignersWidget && rotatingAssigners.length > 0 && (
                            <div className="ml-8 space-y-2 pl-4 border-l-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        Select Assigners
                                    </Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const allIds = rotatingAssigners.map((a) => a.id);
                                                handleUpdateSelectedRotatingAssigners(allIds);
                                            }}
                                        >
                                            Check All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                handleUpdateSelectedRotatingAssigners([]);
                                            }}
                                        >
                                            Uncheck All
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {rotatingAssigners.map((assigner) => {
                                        const isSelected = selectedRotatingAssignerIds?.includes(assigner.id) ?? false;
                                        return (
                                            <div key={assigner.id} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={`rotating-assigner-${assigner.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) => {
                                                        const currentIds = selectedRotatingAssignerIds || [];
                                                        const newIds = checked
                                                            ? [...currentIds, assigner.id]
                                                            : currentIds.filter((id) => id !== assigner.id);
                                                        handleUpdateSelectedRotatingAssigners(newIds);
                                                    }}
                                                    className="mt-1"
                                                />
                                                <Label
                                                    htmlFor={`rotating-assigner-${assigner.id}`}
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {assigner.name}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
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

    // Query assigners for default selection
    const { data: randomAssignersData } = db.useQuery(
        classId
            ? {
                  random_assigners: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                  },
              }
            : null
    );

    const { data: rotatingAssignersData } = db.useQuery(
        classId
            ? {
                  rotating_assigners: {
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
    const showExpectationsWidget = existingSettings?.showExpectationsWidget ?? false;
    const showRandomAssignersWidget = existingSettings?.showRandomAssignersWidget ?? false;
    const showRotatingAssignersWidget = existingSettings?.showRotatingAssignersWidget ?? false;
    const showGroupsTeamsWidget = existingSettings?.showGroupsTeamsWidget ?? false;

    const typedRandomAssignersData = (randomAssignersData as RandomAssignersQueryResult | undefined) ?? null;
    const randomAssigners = typedRandomAssignersData?.random_assigners || [];

    const typedRotatingAssignersData = (rotatingAssignersData as RotatingAssignersQueryResult | undefined) ?? null;
    const rotatingAssigners = typedRotatingAssignersData?.rotating_assigners || [];

    // Parse selected assigner IDs - default to all if widget is enabled and no selection exists
    const selectedRandomAssignerIds = useMemo(() => {
        if (!existingSettings?.selectedRandomAssignerIds) {
            // If widget is enabled but no selection, default to all assigners
            if (showRandomAssignersWidget && randomAssigners.length > 0) {
                return randomAssigners.map((a) => a.id);
            }
            return null;
        }
        try {
            const parsed = JSON.parse(existingSettings.selectedRandomAssignerIds);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            // If parsing fails and widget is enabled, default to all
            if (showRandomAssignersWidget && randomAssigners.length > 0) {
                return randomAssigners.map((a) => a.id);
            }
            return null;
        }
    }, [existingSettings?.selectedRandomAssignerIds, showRandomAssignersWidget, randomAssigners]);

    const selectedRotatingAssignerIds = useMemo(() => {
        if (!existingSettings?.selectedRotatingAssignerIds) {
            // If widget is enabled but no selection, default to all assigners
            if (showRotatingAssignersWidget && rotatingAssigners.length > 0) {
                return rotatingAssigners.map((a) => a.id);
            }
            return null;
        }
        try {
            const parsed = JSON.parse(existingSettings.selectedRotatingAssignerIds);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            // If parsing fails and widget is enabled, default to all
            if (showRotatingAssignersWidget && rotatingAssigners.length > 0) {
                return rotatingAssigners.map((a) => a.id);
            }
            return null;
        }
    }, [existingSettings?.selectedRotatingAssignerIds, showRotatingAssignersWidget, rotatingAssigners]);

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
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No students available
                                </div>
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
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {showPointsWidget && classId ? (
                                        <PointsWidget classId={classId} studentId={selectedStudentId} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {showPointsWidget
                                                ? "Loading widget..."
                                                : "Points widget is disabled. Enable it in Settings to preview."}
                                        </p>
                                    )}
                                    {showExpectationsWidget && classId ? (
                                        <ExpectationsWidget classId={classId} studentId={selectedStudentId} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {showExpectationsWidget
                                                ? "Loading widget..."
                                                : "Expectations widget is disabled. Enable it in Settings to preview."}
                                        </p>
                                    )}
                                    {showRandomAssignersWidget && classId ? (
                                        <RandomAssignersWidget
                                            classId={classId}
                                            studentId={selectedStudentId}
                                            selectedAssignerIds={selectedRandomAssignerIds ?? undefined}
                                        />
                                    ) : null}
                                    {showRotatingAssignersWidget && classId ? (
                                        <RotatingAssignersWidget
                                            classId={classId}
                                            studentId={selectedStudentId}
                                            selectedAssignerIds={selectedRotatingAssignerIds ?? undefined}
                                        />
                                    ) : null}
                                    {showGroupsTeamsWidget && classId ? (
                                        <GroupsTeamsWidget
                                            classId={classId}
                                            studentId={selectedStudentId}
                                        />
                                    ) : null}
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
