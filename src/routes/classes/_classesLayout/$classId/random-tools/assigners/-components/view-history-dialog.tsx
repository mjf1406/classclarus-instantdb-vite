/** @format */

import { useState } from "react";
import { naturalSort } from "@/lib/natural-sort";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import type { AssignerType } from "./assigner-form";
import type { AssignmentResult } from "@/lib/assigners/run-random-assigner";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

// Dynamic imports for PDF components
import { AssignerResultsPDFDocument as RandomAssignerResultsPDFDocument } from "./random/assigner-results-pdf-document";
import { AssignerResultsPDFDocument as RotatingAssignerResultsPDFDocument } from "./rotating/assigner-results-pdf-document";
import { AssignerResultsPDFDocument as EquitableAssignerResultsPDFDocument } from "./equitable/assigner-results-pdf-document";

type AssignerRunEntity =
    | InstaQLEntity<AppSchema, "random_assigner_runs", {}>
    | InstaQLEntity<AppSchema, "rotating_assigner_runs", {}>
    | InstaQLEntity<AppSchema, "equitable_assigner_runs", {}>;

interface ViewHistoryDialogProps {
    children: React.ReactNode;
    assignerType: AssignerType;
    run: AssignerRunEntity;
    results: AssignmentResult[];
    assignerName: string;
    className: string;
    allItems?: string[]; // Optional: all items from assigner (to show items with no assignments)
}

// Get all unique items from results, or use provided allItems if available
function getAllItems(results: AssignmentResult[], allItems?: string[]): string[] {
    if (allItems && allItems.length > 0) {
        // Use provided items list to ensure all items appear, even without assignments
        return naturalSort(allItems);
    }
    // Fallback: extract from results
    const itemsSet = new Set<string>();
    for (const result of results) {
        itemsSet.add(result.item);
    }
    return naturalSort(Array.from(itemsSet));
}

// Get all unique groups/teams from results
function getAllGroupsTeams(results: AssignmentResult[]): Array<{
    id: string;
    name: string;
    isTeam: boolean;
    key: string;
}> {
    const groupsSet = new Map<
        string,
        { id: string; name: string; isTeam: boolean }
    >();

    for (const result of results) {
        const key = `${result.groupOrTeamId}-${result.isTeam ? "team" : "group"}`;
        if (!groupsSet.has(key)) {
            groupsSet.set(key, {
                id: result.groupOrTeamId,
                name: result.groupOrTeamName,
                isTeam: result.isTeam,
            });
        }
    }

    return Array.from(groupsSet.entries()).map(([key, value]) => ({
        ...value,
        key,
    }));
}

// Organize results by group/team and item
function organizeResults(
    results: AssignmentResult[]
): Map<string, Map<string, AssignmentResult[]>> {
    const organized = new Map<string, Map<string, AssignmentResult[]>>();

    for (const result of results) {
        const key = `${result.groupOrTeamId}-${result.isTeam ? "team" : "group"}`;
        if (!organized.has(key)) {
            organized.set(key, new Map());
        }
        const groupMap = organized.get(key)!;
        if (!groupMap.has(result.item)) {
            groupMap.set(result.item, []);
        }
        groupMap.get(result.item)!.push(result);
    }

    return organized;
}

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

export function ViewHistoryDialog({
    children,
    assignerType,
    run,
    results,
    assignerName,
    className,
    allItems: providedAllItems,
}: ViewHistoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const allItems = getAllItems(results, providedAllItems);
    const allGroupsTeams = getAllGroupsTeams(results);
    const organizedResults = organizeResults(results);
    const PDFComponent = getPDFComponent(assignerType);

    const formatDate = (date: Date | string | number): string => {
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

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const generatedDate = formatDate(run.runDate);
            const doc = (
                <PDFComponent
                    assignerName={assignerName}
                    className={className}
                    generatedDate={generatedDate}
                    results={results}
                    allItems={providedAllItems}
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
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>View Assignment Results</DialogTitle>
                    <DialogDescription>
                        Run from {formatDate(run.runDate)}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Item</TableHead>
                                {allGroupsTeams.map((groupTeam) => (
                                    <TableHead key={groupTeam.key}>
                                        {groupTeam.isTeam ? "Team: " : "Group: "}
                                        {groupTeam.name}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allItems.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={allGroupsTeams.length + 1}
                                        className="text-center text-muted-foreground"
                                    >
                                        No assignments found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allItems.map((item) => (
                                    <TableRow key={item}>
                                        <TableCell className="font-medium">
                                            {item}
                                        </TableCell>
                                        {allGroupsTeams.map((groupTeam) => {
                                            const assignments =
                                                organizedResults
                                                    .get(groupTeam.key)
                                                    ?.get(item) || [];

                                            return (
                                                <TableCell key={groupTeam.key}>
                                                    {assignments.length > 0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            {assignments.map((assignment, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    {assignment.studentNumber !==
                                                                        null && (
                                                                        <span className="font-semibold text-muted-foreground">
                                                                            {assignment.studentNumber}
                                                                            {" - "}
                                                                        </span>
                                                                    )}
                                                                    <span>
                                                                        {assignment.studentName}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isExporting}
                    >
                        Close
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="size-4 mr-2" />
                                Export PDF
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
