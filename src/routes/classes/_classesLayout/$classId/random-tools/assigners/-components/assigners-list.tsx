/** @format */

import { Plus, MoreVertical, Package } from "lucide-react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAssignerDialog } from "./create-assigner-dialog";
import { EditAssignerDialog } from "./edit-assigner-dialog";
import { DeleteAssignerDialog } from "./delete-assigner-dialog";
import { AssignerHistoryTable } from "./assigner-history-table";
import { useClassRoster } from "@/hooks/use-class-roster";
import { useClassById } from "@/hooks/use-class-hooks";
import { runRandomAssigner } from "@/lib/assigners/run-random-assigner";
import { id } from "@instantdb/react";
import { pdf } from "@react-pdf/renderer";
import type { AssignerType } from "./assigner-form";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { SelectedItem, Group } from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/-components/groups-teams-pdf-document";
import type { AssignmentResult } from "@/lib/assigners/run-random-assigner";

// Dynamic imports for PDF components
import { AssignerResultsPDFDocument as RandomAssignerResultsPDFDocument } from "./random/assigner-results-pdf-document";
import { AssignerResultsPDFDocument as RotatingAssignerResultsPDFDocument } from "./rotating/assigner-results-pdf-document";
import { AssignerResultsPDFDocument as EquitableAssignerResultsPDFDocument } from "./equitable/assigner-results-pdf-document";
import { RunAssignerDialog } from "./run-assigner-dialog";

interface AssignersListProps {
    assignerType: AssignerType;
    classId: string;
    canManage: boolean;
}

type AssignerEntity =
    | InstaQLEntity<AppSchema, "random_assigners", { class: {} }>
    | InstaQLEntity<AppSchema, "rotating_assigners", { class: {} }>
    | InstaQLEntity<AppSchema, "equitable_assigners", { class: {} }>;

type AssignersQueryResult = {
    random_assigners?: InstaQLEntity<AppSchema, "random_assigners", { class: {} }>[];
    rotating_assigners?: InstaQLEntity<AppSchema, "rotating_assigners", { class: {} }>[];
    equitable_assigners?: InstaQLEntity<AppSchema, "equitable_assigners", { class: {} }>[];
};

type GroupsQueryResult = {
    groups: Group[];
};

const ASSIGNER_TYPE_CONFIG: Record<
    AssignerType,
    {
        entityName: string;
        emptyTitle: string;
        emptyDescription: string;
        createButtonText: string;
    }
> = {
    random: {
        entityName: "random_assigners",
        emptyTitle: "No Random Assigners",
        emptyDescription: "Create your first random assigner to start assigning items to students.",
        createButtonText: "Create Random Assigner",
    },
    rotating: {
        entityName: "rotating_assigners",
        emptyTitle: "No Rotating Assigners",
        emptyDescription: "Create your first rotating assigner to start assigning items to students.",
        createButtonText: "Create Rotating Assigner",
    },
    equitable: {
        entityName: "equitable_assigners",
        emptyTitle: "No Equitable Assigners",
        emptyDescription: "Create your first equitable assigner to start assigning items to students.",
        createButtonText: "Create Equitable Assigner",
    },
};

// Get PDF component based on assigner type
function getPDFComponent(assignerType: AssignerType) {
    switch (assignerType) {
        case "random":
            return RandomAssignerResultsPDFDocument;
        case "rotating":
            return RotatingAssignerResultsPDFDocument;
        case "equitable":
            return EquitableAssignerResultsPDFDocument;
        default:
            return RandomAssignerResultsPDFDocument;
    }
}

export function AssignersList({
    assignerType,
    classId,
    canManage,
}: AssignersListProps) {
    const config = ASSIGNER_TYPE_CONFIG[assignerType];

    const assignersQuery =
        classId && assignerType === "random"
            ? {
                  random_assigners: {
                      $: { where: { "class.id": classId } },
                      class: {},
                  },
              }
            : classId && assignerType === "rotating"
              ? {
                    rotating_assigners: {
                        $: { where: { "class.id": classId } },
                        class: {},
                    },
                }
              : classId && assignerType === "equitable"
                ? {
                      equitable_assigners: {
                          $: { where: { "class.id": classId } },
                          class: {},
                      },
                  }
                : null;

    const { data, isLoading } = db.useQuery(assignersQuery);

    // Query groups with students and teams
    const { data: groupsData } = db.useQuery(
        classId
            ? {
                  groups: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                      groupStudents: {},
                      groupTeams: {
                          teamStudents: {},
                      },
                  },
              }
            : null
    );

    const { class: classEntity } = useClassById(classId);
    const { rosterByStudentId } = useClassRoster(classId);

    const typedAssigners = (data as AssignersQueryResult | undefined) ?? null;
    const assigners = (typedAssigners?.[config.entityName as keyof AssignersQueryResult] ?? []) as AssignerEntity[];

    const typedGroupsData = (groupsData as GroupsQueryResult | undefined) ?? null;
    const groups = typedGroupsData?.groups || [];

    // Parse items count for each assigner
    const getItemCount = (assigner: AssignerEntity): number => {
        try {
            if (!assigner.items || !assigner.items.trim()) return 0;
            const parsed = JSON.parse(assigner.items);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    };

    const handleRunAssigner = async (
        assignerId: string,
        selectedItems: SelectedItem[],
        shouldExport: boolean
    ) => {
        // Find the assigner
        const assigner = assigners.find((a) => a.id === assignerId);
        if (!assigner) {
            console.error("Assigner not found");
            return;
        }

        let results: AssignmentResult[] = [];

        if (assignerType === "random") {
            // Convert roster map to the format expected by runRandomAssigner
            const rosterMap = new Map<
                string,
                {
                    id: string;
                    firstName: string | null | undefined;
                    lastName: string | null | undefined;
                    number: number | null | undefined;
                }
            >();

            for (const [studentId, rosterEntry] of rosterByStudentId.entries()) {
                rosterMap.set(studentId, {
                    id: rosterEntry.id,
                    firstName: rosterEntry.firstName,
                    lastName: rosterEntry.lastName,
                    number: rosterEntry.number ?? null,
                });
            }

            // Run the assigner
            results = runRandomAssigner({
                assigner,
                selectedItems,
                rosterByStudentId: rosterMap,
            });
        } else {
            // TODO: Implement rotating/equitable logic
            console.log(`${assignerType} assigner run - not yet implemented`);
            // Placeholder: empty results for now
            results = [];
        }

        if (results.length === 0 && assignerType === "random") {
            console.warn("No assignments generated");
            return;
        }

        // Save to appropriate history table based on assignerType
        const runId = id();
        const runDate = new Date();
        const resultsJson = JSON.stringify(results);

        if (assignerType === "random") {
            db.transact([
                db.tx.random_assigner_runs[runId]
                    .create({
                        runDate,
                        results: resultsJson,
                    })
                    .link({ randomAssigner: assignerId })
                    .link({ class: classId }),
            ]);
        } else if (assignerType === "rotating") {
            db.transact([
                db.tx.rotating_assigner_runs[runId]
                    .create({
                        runDate,
                        results: resultsJson,
                    })
                    .link({ rotatingAssigner: assignerId })
                    .link({ class: classId }),
            ]);
        } else {
            db.transact([
                db.tx.equitable_assigner_runs[runId]
                    .create({
                        runDate,
                        results: resultsJson,
                    })
                    .link({ equitableAssigner: assignerId })
                    .link({ class: classId }),
            ]);
        }

        // Export PDF if requested
        if (shouldExport) {
            try {
                const generatedDate = runDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                const PDFComponent = getPDFComponent(assignerType);
                const doc = (
                    <PDFComponent
                        assignerName={assigner.name}
                        className={classEntity?.name || "Class"}
                        generatedDate={generatedDate}
                        results={results}
                    />
                );

                const blob = await pdf(doc).toBlob();
                const url = URL.createObjectURL(blob);

                // Create filename
                const dateStr = runDate.toISOString().split("T")[0];
                const safeAssignerName = assigner.name.replace(
                    /[^a-zA-Z0-9]/g,
                    "_"
                );
                const filename = `${safeAssignerName}_results_${dateStr}.pdf`;

                // Download the PDF
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Failed to generate PDF:", error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {assigners.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="size-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {config.emptyTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            {canManage
                                ? config.emptyDescription
                                : `No ${assignerType} assigners have been created yet.`}
                        </p>
                        {canManage && (
                            <CreateAssignerDialog assignerType={assignerType} classId={classId}>
                                <Button>
                                    <Plus className="size-4" />
                                    {config.createButtonText}
                                </Button>
                            </CreateAssignerDialog>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {assigners.map((assigner) => {
                        const itemCount = getItemCount(assigner);
                        return (
                            <div key={assigner.id} className="space-y-4">
                                <AssignerHistoryTable
                                    assignerType={assignerType}
                                    assignerId={assigner.id}
                                    assignerName={assigner.name}
                                    className={classEntity?.name || "Class"}
                                />
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {canManage ? (
                                                    <RunAssignerDialog
                                                        assigner={assigner}
                                                        groups={groups}
                                                        onRunAssigner={handleRunAssigner}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 text-lg font-semibold justify-start"
                                                        >
                                                            {assigner.name}
                                                        </Button>
                                                    </RunAssignerDialog>
                                                ) : (
                                                    <CardTitle className="text-lg">
                                                        {assigner.name}
                                                    </CardTitle>
                                                )}
                                            </div>
                                            {canManage && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                        >
                                                            <MoreVertical className="size-4" />
                                                            <span className="sr-only">
                                                                More options
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <EditAssignerDialog
                                                            assignerType={assignerType}
                                                            assigner={assigner}
                                                            asDropdownItem
                                                        >
                                                            Edit
                                                        </EditAssignerDialog>
                                                        <DeleteAssignerDialog
                                                            assignerType={assignerType}
                                                            assigner={assigner}
                                                            asDropdownItem
                                                        >
                                                            Delete
                                                        </DeleteAssignerDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="size-4" />
                                            <span>
                                                {itemCount === 1
                                                    ? "1 item"
                                                    : `${itemCount} items`}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
