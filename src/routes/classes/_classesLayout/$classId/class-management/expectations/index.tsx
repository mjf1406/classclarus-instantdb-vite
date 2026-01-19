/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { Target, Plus, MoreVertical, Pencil, Trash2, LayoutGrid, Table2 } from "lucide-react";
import { useState } from "react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CreateExpectationDialog } from "./-components/create-expectation-dialog";
import { EditExpectationDialog } from "./-components/edit-expectation-dialog";
import { DeleteExpectationDialog } from "./-components/delete-expectation-dialog";
import { ExpectationsTable } from "./-components/expectations-table";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/class-management/expectations/"
)({
    component: RouteComponent,
});

type Expectation = InstaQLEntity<
    AppSchema,
    "expectations",
    { class?: {} }
>;

type StudentExpectation = InstaQLEntity<
    AppSchema,
    "student_expectations",
    { expectation?: {}; student?: {}; class?: {} }
>;

type ExpectationsQueryResult = { expectations: Expectation[] };
type StudentExpectationsQueryResult = { student_expectations: StudentExpectation[] };

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const [view, setView] = useState<"table" | "grid">("table");
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    const { data, isLoading: dataLoading } = db.useQuery(
        classId
            ? {
                  expectations: {
                      $: { where: { "class.id": classId } },
                      class: {},
                  },
                  student_expectations: {
                      $: { where: { "class.id": classId } },
                      expectation: {},
                      student: {},
                      class: {},
                  },
              }
            : null
    );

    const typedExpectations = (data as ExpectationsQueryResult | undefined) ?? null;
    const expectations = typedExpectations?.expectations ?? [];

    const typedStudentExpectations = (data as StudentExpectationsQueryResult | undefined) ?? null;
    const studentExpectations = typedStudentExpectations?.student_expectations ?? [];

    const students = classEntity?.classStudents || [];

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

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
                        <Target className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Expectations
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage expectations for your class
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {expectations.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant={view === "table" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setView("table")}
                                    aria-label="Table view"
                                >
                                    <Table2 className="size-4" />
                                </Button>
                                <Button
                                    variant={view === "grid" ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setView("grid")}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid className="size-4" />
                                </Button>
                            </div>
                        )}
                        {canManage && (
                            <CreateExpectationDialog classId={classId}>
                                <Button>
                                    <Plus className="size-4 mr-2" />
                                    Create Expectation
                                </Button>
                            </CreateExpectationDialog>
                        )}
                    </div>
                </div>

                {dataLoading || isLoading ? (
                    view === "table" ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <div className="rounded-md border">
                                <div className="p-8 space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-4 w-24" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )
                ) : expectations.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Target className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                No expectations have been created yet.
                            </p>
                            {canManage && (
                                <CreateExpectationDialog classId={classId}>
                                    <Button>
                                        <Plus className="size-4 mr-2" />
                                        Create Your First Expectation
                                    </Button>
                                </CreateExpectationDialog>
                            )}
                        </CardContent>
                    </Card>
                ) : view === "table" ? (
                    <ExpectationsTable
                        students={students}
                        expectations={expectations}
                        studentExpectations={studentExpectations}
                        classId={classId}
                        canManage={canManage}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {expectations.map((expectation) => (
                            <Card key={expectation.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-base">
                                                {expectation.name}
                                            </CardTitle>
                                            {expectation.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {expectation.description}
                                                </p>
                                            )}
                                        </div>
                                        {canManage && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreVertical className="size-4" />
                                                        <span className="sr-only">
                                                            More options
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <EditExpectationDialog
                                                        expectation={expectation}
                                                        classId={classId}
                                                        asDropdownItem
                                                    >
                                                        <Pencil className="size-4" /> Edit
                                                    </EditExpectationDialog>
                                                    <DeleteExpectationDialog
                                                        expectation={expectation}
                                                        asDropdownItem
                                                    >
                                                        <Trash2 className="size-4" /> Delete
                                                    </DeleteExpectationDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">
                                            {expectation.inputType === "number"
                                                ? "Number"
                                                : "Number Range"}
                                        </Badge>
                                        <Badge variant="outline">
                                            Unit: {expectation.unit}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
