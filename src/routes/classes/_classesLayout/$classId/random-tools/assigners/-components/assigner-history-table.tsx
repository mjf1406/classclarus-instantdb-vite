/** @format */

import { useState } from "react";
import { db } from "@/lib/db/db";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronRight, Eye, Download, Loader2, Trash2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import type { AssignerType } from "./assigner-form";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { AssignmentResult } from "@/lib/assigners/run-random-assigner";
import { ViewHistoryDialog } from "./view-history-dialog";

// Dynamic imports for PDF components
import { AssignerResultsPDFDocument as RandomAssignerResultsPDFDocument } from "./random/assigner-results-pdf-document";
import { AssignerResultsPDFDocument as RotatingAssignerResultsPDFDocument } from "./rotating/assigner-results-pdf-document";
import { AssignerResultsPDFDocument as EquitableAssignerResultsPDFDocument } from "./equitable/assigner-results-pdf-document";

interface AssignerHistoryTableProps {
    assignerType: AssignerType;
    assignerId: string;
    assignerName: string;
    className: string;
}

type AssignerRunEntity =
    | InstaQLEntity<
          AppSchema,
          "random_assigner_runs",
          {
              randomAssigner: {};
              class: {};
          }
      >
    | InstaQLEntity<
          AppSchema,
          "rotating_assigner_runs",
          {
              rotatingAssigner: {};
              class: {};
          }
      >
    | InstaQLEntity<
          AppSchema,
          "equitable_assigner_runs",
          {
              equitableAssigner: {};
              class: {};
          }
      >;

type AssignerRunsQueryResult = {
    random_assigner_runs?: InstaQLEntity<
        AppSchema,
        "random_assigner_runs",
        { randomAssigner: {}; class: {} }
    >[];
    rotating_assigner_runs?: InstaQLEntity<
        AppSchema,
        "rotating_assigner_runs",
        { rotatingAssigner: {}; class: {} }
    >[];
    equitable_assigner_runs?: InstaQLEntity<
        AppSchema,
        "equitable_assigner_runs",
        { equitableAssigner: {}; class: {} }
    >[];
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

export function AssignerHistoryTable({
    assignerType,
    assignerId,
    assignerName,
    className,
}: AssignerHistoryTableProps) {
    const [open, setOpen] = useState(false);
    const [exportingRunId, setExportingRunId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
    const [runToDelete, setRunToDelete] = useState<AssignerRunEntity | null>(null);

    // Build query based on assigner type
    const entityName =
        assignerType === "random"
            ? "random_assigner_runs"
            : assignerType === "rotating"
              ? "rotating_assigner_runs"
              : "equitable_assigner_runs";

    // Query history runs for this assigner
    const query =
        assignerType === "random"
            ? {
                  random_assigner_runs: {
                      $: {
                          where: { "randomAssigner.id": assignerId },
                          order: { runDate: "desc" as const },
                      },
                      randomAssigner: {},
                      class: {},
                  },
              }
            : assignerType === "rotating"
              ? {
                    rotating_assigner_runs: {
                        $: {
                            where: { "rotatingAssigner.id": assignerId },
                            order: { runDate: "desc" as const },
                        },
                        rotatingAssigner: {},
                        class: {},
                    },
                }
              : {
                    equitable_assigner_runs: {
                        $: {
                            where: { "equitableAssigner.id": assignerId },
                            order: { runDate: "desc" as const },
                        },
                        equitableAssigner: {},
                        class: {},
                    },
                };

    const { data, isLoading } = db.useQuery(query);

    const typedData = (data as AssignerRunsQueryResult | undefined) ?? null;
    const runs = (typedData?.[entityName as keyof AssignerRunsQueryResult] ?? []) as AssignerRunEntity[];

    const parseResults = (resultsJson: string): AssignmentResult[] => {
        try {
            return JSON.parse(resultsJson);
        } catch {
            return [];
        }
    };

    const getGroupsTeamsSummary = (results: AssignmentResult[]): {
        groups: string[];
        teams: string[];
    } => {
        const groups = new Set<string>();
        const teams = new Set<string>();

        for (const result of results) {
            if (result.isTeam) {
                teams.add(result.groupOrTeamName);
            } else {
                groups.add(result.groupOrTeamName);
            }
        }

        return {
            groups: Array.from(groups).sort(),
            teams: Array.from(teams).sort(),
        };
    };

    const formatDate = (date: Date | string | number): string => {
        const d =
            typeof date === "string" || typeof date === "number"
                ? new Date(date)
                : date;
        return d.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatDateForPDF = (date: Date | string | number): string => {
        const d =
            typeof date === "string" || typeof date === "number"
                ? new Date(date)
                : date;
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleExport = async (run: AssignerRunEntity, results: AssignmentResult[]) => {
        setExportingRunId(run.id);

        try {
            const generatedDate = formatDateForPDF(run.runDate);
            const PDFComponent = getPDFComponent(assignerType);
            const doc = (
                <PDFComponent
                    assignerName={assignerName}
                    className={className}
                    generatedDate={generatedDate}
                    results={results}
                />
            );

            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);

            // Create filename
            const dateStr = new Date(run.runDate).toISOString().split("T")[0];
            const safeAssignerName = assignerName.replace(/[^a-zA-Z0-9]/g, "_");
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
        } finally {
            setExportingRunId(null);
        }
    };

    const handleDeleteClick = (run: AssignerRunEntity) => {
        setRunToDelete(run);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!runToDelete) return;

        setDeletingRunId(runToDelete.id);

        try {
            db.transact([
                db.tx[entityName as keyof typeof db.tx][runToDelete.id].delete(),
            ]);
            setDeleteDialogOpen(false);
            setRunToDelete(null);
        } catch (error) {
            console.error("Failed to delete run:", error);
        } finally {
            setDeletingRunId(null);
        }
    };

    if (isLoading) {
        return null;
    }

    if (runs.length === 0) {
        return null;
    }

    return (
        <Collapsible className="group/collapsible" open={open} onOpenChange={setOpen}>
            <Card>
                <CollapsibleTrigger className="w-full">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <span className="font-medium">Run History</span>
                            <span className="text-sm text-muted-foreground">
                                ({runs.length} run{runs.length !== 1 ? "s" : ""})
                            </span>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>Groups</TableHead>
                                    <TableHead>Teams</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.map((run) => {
                                    const results = parseResults(run.results);
                                    const { groups, teams } = getGroupsTeamsSummary(results);

                                    return (
                                        <TableRow key={run.id}>
                                            <TableCell className="font-medium">
                                                {formatDate(run.runDate)}
                                            </TableCell>
                                            <TableCell>
                                                {groups.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {groups.map((group, idx) => (
                                                            <span key={idx}>{group}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {teams.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {teams.map((team, idx) => (
                                                            <span key={idx}>{team}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <ViewHistoryDialog
                                                        assignerType={assignerType}
                                                        run={run}
                                                        results={results}
                                                        assignerName={assignerName}
                                                        className={className}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                        >
                                                            <Eye className="size-4" />
                                                            <span className="sr-only">View</span>
                                                        </Button>
                                                    </ViewHistoryDialog>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => handleExport(run, results)}
                                                        disabled={exportingRunId === run.id}
                                                    >
                                                        {exportingRunId === run.id ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Download className="size-4" />
                                                        )}
                                                        <span className="sr-only">Export PDF</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => handleDeleteClick(run)}
                                                        disabled={deletingRunId === run.id}
                                                    >
                                                        {deletingRunId === run.id ? (
                                                            <Loader2 className="size-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="size-4" />
                                                        )}
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </CollapsibleContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Run History</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this run from{" "}
                            {runToDelete ? formatDate(runToDelete.runDate) : ""}? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingRunId !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deletingRunId !== null}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletingRunId !== null ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Collapsible>
    );
}
