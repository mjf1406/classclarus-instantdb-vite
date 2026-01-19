/** @format */

import { useMemo, useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table";
import Fuse from "fuse.js";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Settings2 } from "lucide-react";
import { EditableExpectationCell } from "./editable-expectation-cell";
import { BulkSetExpectationDialog } from "./bulk-set-expectation-dialog";
import { useClassRoster } from "@/hooks/use-class-roster";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Student = InstaQLEntity<AppSchema, "$users">;
type Expectation = InstaQLEntity<AppSchema, "expectations">;
type StudentExpectation = InstaQLEntity<
    AppSchema,
    "student_expectations",
    { expectation?: {}; student?: {}; class?: {} }
>;

type TableRowData = {
    studentId: string;
    student: Student;
    number: number | null;
    firstName: string | null;
    lastName: string | null;
    [key: string]: unknown; // For dynamic expectation columns
};

interface ExpectationsTableProps {
    students: Student[];
    expectations: Expectation[];
    studentExpectations: StudentExpectation[];
    classId: string;
    canManage: boolean;
}

export function ExpectationsTable({
    students,
    expectations,
    studentExpectations,
    classId,
    canManage,
}: ExpectationsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { rosterByStudentId } = useClassRoster(classId);

    // Create map for quick student expectation lookup
    const studentExpectationMap = useMemo(() => {
        const map = new Map<string, Map<string, StudentExpectation>>();
        for (const se of studentExpectations) {
            const studentId = se.student?.id;
            const expectationId = se.expectation?.id;
            if (studentId && expectationId) {
                if (!map.has(studentId)) {
                    map.set(studentId, new Map());
                }
                map.get(studentId)!.set(expectationId, se);
            }
        }
        return map;
    }, [studentExpectations]);

    // Transform data into table rows
    const tableData = useMemo<TableRowData[]>(() => {
        return students.map((student) => {
            const roster = rosterByStudentId.get(student.id);
            const row: TableRowData = {
                studentId: student.id,
                student,
                number: roster?.number ?? null,
                firstName: roster?.firstName ?? null,
                lastName: roster?.lastName ?? null,
            };

            // Add expectation values to row
            for (const expectation of expectations) {
                const se = studentExpectationMap
                    .get(student.id)
                    ?.get(expectation.id);
                const key = `expectation-${expectation.id}`;
                row[key] = se || null;
            }

            return row;
        });
    }, [students, expectations, rosterByStudentId, studentExpectationMap]);

    // Apply search filter
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) {
            return tableData;
        }

        // Create searchable data with expectation values as strings
        const searchableData = tableData.map((row) => {
            const searchable: Record<string, string | number | null> = {
                firstName: row.firstName || "",
                lastName: row.lastName || "",
                number: row.number,
            };

            // Add expectation values as searchable strings
            for (const expectation of expectations) {
                const key = `expectation-${expectation.id}`;
                const se = row[key] as StudentExpectation | null;
                if (se) {
                    if (expectation.inputType === "number") {
                        searchable[key] =
                            se.value != null ? String(se.value) : "";
                    } else {
                        searchable[key] =
                            se.minValue != null && se.maxValue != null
                                ? `${se.minValue}-${se.maxValue}`
                                : "";
                    }
                } else {
                    searchable[key] = "";
                }
            }

            return { ...row, ...searchable };
        });

        // Setup fuzzy search with all searchable fields
        const fuse = new Fuse(searchableData, {
            keys: [
                "firstName",
                "lastName",
                { name: "number", getFn: (row) => row.number != null ? String(row.number) : "" },
                ...expectations.map((exp) => ({
                    name: `expectation-${exp.id}`,
                    getFn: (row: any) => row[`expectation-${exp.id}`] || "",
                })),
            ],
            threshold: 0.3,
            includeScore: true,
        });

        const results = fuse.search(searchQuery);
        return results.map((result) => result.item as TableRowData);
    }, [tableData, searchQuery, expectations]);

    // Define columns
    const columns = useMemo<ColumnDef<TableRowData>[]>(() => {
        const baseColumns: ColumnDef<TableRowData>[] = [
            {
                accessorKey: "number",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === "asc"
                                )
                            }
                            className="h-8 px-2"
                        >
                            Number
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 size-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 size-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 size-4" />
                            )}
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    const num = row.original.number;
                    return (
                        <span className="tabular-nums">
                            {num != null ? String(num) : "—"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "firstName",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === "asc"
                                )
                            }
                            className="h-8 px-2"
                        >
                            First Name
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 size-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 size-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 size-4" />
                            )}
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    return <span>{row.original.firstName || "—"}</span>;
                },
            },
            {
                accessorKey: "lastName",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === "asc"
                                )
                            }
                            className="h-8 px-2"
                        >
                            Last Name
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 size-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 size-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 size-4" />
                            )}
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    return <span>{row.original.lastName || "—"}</span>;
                },
            },
        ];

        // Add dynamic columns for each expectation
        const expectationColumns: ColumnDef<TableRowData>[] =
            expectations.map((expectation) => ({
                id: `expectation-${expectation.id}`,
                header: ({ column }) => {
                    return (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    column.toggleSorting(
                                        column.getIsSorted() === "asc"
                                    )
                                }
                                className="h-8 px-2 flex-1 justify-start"
                            >
                                {expectation.name}
                                {column.getIsSorted() === "asc" ? (
                                    <ArrowUp className="ml-2 size-4" />
                                ) : column.getIsSorted() === "desc" ? (
                                    <ArrowDown className="ml-2 size-4" />
                                ) : (
                                    <ArrowUpDown className="ml-2 size-4" />
                                )}
                            </Button>
                            {canManage && (
                                <BulkSetExpectationDialog
                                    expectation={expectation}
                                    students={students}
                                    studentExpectations={studentExpectations}
                                    classId={classId}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        aria-label={`Set ${expectation.name} for all students`}
                                    >
                                        <Settings2 className="size-4" />
                                    </Button>
                                </BulkSetExpectationDialog>
                            )}
                        </div>
                    );
                },
                cell: ({ row }) => {
                    const se = row.original[
                        `expectation-${expectation.id}`
                    ] as StudentExpectation | null;
                    return (
                        <EditableExpectationCell
                            studentId={row.original.studentId}
                            expectation={expectation}
                            studentExpectation={se}
                            classId={classId}
                            canManage={canManage}
                        />
                    );
                },
                sortingFn: (rowA, rowB) => {
                    const seA = rowA.original[
                        `expectation-${expectation.id}`
                    ] as StudentExpectation | null;
                    const seB = rowB.original[
                        `expectation-${expectation.id}`
                    ] as StudentExpectation | null;

                    if (expectation.inputType === "number") {
                        const valA = seA?.value ?? null;
                        const valB = seB?.value ?? null;
                        if (valA === null && valB === null) return 0;
                        if (valA === null) return 1;
                        if (valB === null) return -1;
                        return valA - valB;
                    } else {
                        const minA = seA?.minValue ?? null;
                        const minB = seB?.minValue ?? null;
                        if (minA === null && minB === null) return 0;
                        if (minA === null) return 1;
                        if (minB === null) return -1;
                        return minA - minB;
                    }
                },
            }));

        return [...baseColumns, ...expectationColumns];
    }, [expectations, classId, canManage]);

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    });

    if (students.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                No students in this class.
            </div>
        );
    }

    if (expectations.length === 0) {
        return (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
                No expectations defined. Create expectations to see them in the table.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search students and expectations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
