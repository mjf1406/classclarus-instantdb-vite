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
import { RunAssignerDialog } from "../run-assigner-dialog";
import { AssignerHistoryTable } from "./assigner-history-table";
import { useClassRoster } from "@/hooks/use-class-roster";
import { useClassById } from "@/hooks/use-class-hooks";
import { runRandomAssigner } from "@/lib/assigners/run-random-assigner";
import { id } from "@instantdb/react";
import { pdf } from "@react-pdf/renderer";
import { AssignerResultsPDFDocument } from "./assigner-results-pdf-document";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { SelectedItem, Group } from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/-components/groups-teams-pdf-document";

interface RandomAssignersListProps {
    classId: string;
    canManage: boolean;
}

type RandomAssigner = InstaQLEntity<AppSchema, "random_assigners", { class: {} }>;

type RandomAssignersQueryResult = { random_assigners: RandomAssigner[] };

type GroupsQueryResult = {
    groups: Group[];
};

export function RandomAssignersList({
    classId,
    canManage,
}: RandomAssignersListProps) {
    const { data, isLoading } = db.useQuery(
        classId
            ? {
                  random_assigners: {
                      $: { where: { "class.id": classId } },
                      class: {},
                  },
              }
            : null
    );

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

    const typedAssigners =
        (data as RandomAssignersQueryResult | undefined) ?? null;
    const assigners = typedAssigners?.random_assigners ?? [];

    const typedGroupsData =
        (groupsData as GroupsQueryResult | undefined) ?? null;
    const groups = typedGroupsData?.groups || [];

    // Parse items count for each assigner
    const getItemCount = (assigner: RandomAssigner): number => {
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
        const results = runRandomAssigner({
            assigner,
            selectedItems,
            rosterByStudentId: rosterMap,
        });

        if (results.length === 0) {
            console.warn("No assignments generated");
            return;
        }

        // Save to history
        const runId = id();
        const runDate = new Date();
        const resultsJson = JSON.stringify(results);

        db.transact([
            db.tx.random_assigner_runs[runId].create({
                runDate,
                results: resultsJson,
            })
                .link({ randomAssigner: assignerId })
                .link({ class: classId }),
        ]);

        // Export PDF if requested
        if (shouldExport) {
            try {
                const generatedDate = runDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                const doc = (
                    <AssignerResultsPDFDocument
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
                            No Random Assigners
                        </h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            {canManage
                                ? "Create your first random assigner to start assigning items to students."
                                : "No random assigners have been created yet."}
                        </p>
                        {canManage && (
                            <CreateAssignerDialog classId={classId}>
                                <Button>
                                    <Plus className="size-4" />
                                    Create Assigner
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
                                                        assigner={assigner}
                                                        asDropdownItem
                                                    >
                                                        Edit
                                                    </EditAssignerDialog>
                                                    <DeleteAssignerDialog
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
