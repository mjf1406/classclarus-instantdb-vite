/** @format */

import { useState, useMemo, useDeferredValue } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db/db";
import { AssignmentsGrid } from "./-components/assignments-grid";
import { AssignmentsFilters } from "./-components/assignments-filters";
import { CreateAssignmentDialog } from "./-components/create-assignment-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/class-management/assignments/"
)({
    component: RouteComponent,
});

type AssignmentEntity = InstaQLEntity<
    AppSchema,
    "assignments",
    { class?: {} }
>;

type AssignmentsQueryResult = {
    assignments?: AssignmentEntity[];
};

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
        new Set()
    );
    const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());

    // Defer search query for performance
    const deferredSearch = useDeferredValue(searchQuery);

    const assignmentsQuery = classId
        ? {
              assignments: {
                  $: { where: { "class.id": classId } },
                  class: {},
              },
          }
        : null;

    const { data, isLoading: assignmentsLoading } =
        db.useQuery(assignmentsQuery);

    const typedAssignments =
        (data as AssignmentsQueryResult | undefined) ?? null;
    const assignments = typedAssignments?.assignments || [];

    // Extract unique subjects and units (memoized)
    const uniqueSubjects = useMemo(() => {
        const subjects = new Set<string>();
        assignments.forEach((a) => {
            if (a.subject) subjects.add(a.subject);
        });
        return Array.from(subjects).sort();
    }, [assignments]);

    const uniqueUnits = useMemo(() => {
        const units = new Set<string>();
        assignments.forEach((a) => {
            if (a.unit) units.add(a.unit);
        });
        return Array.from(units).sort();
    }, [assignments]);

    // Filter assignments (memoized, single-pass)
    const filteredAssignments = useMemo(() => {
        return assignments.filter((assignment) => {
            // Search filter (case-insensitive)
            if (
                deferredSearch &&
                !assignment.name.toLowerCase().includes(deferredSearch.toLowerCase())
            ) {
                return false;
            }

            // Subject filter
            if (
                selectedSubjects.size > 0 &&
                (!assignment.subject ||
                    !selectedSubjects.has(assignment.subject))
            ) {
                return false;
            }

            // Unit filter
            if (
                selectedUnits.size > 0 &&
                (!assignment.unit || !selectedUnits.has(assignment.unit))
            ) {
                return false;
            }

            return true;
        });
    }, [assignments, deferredSearch, selectedSubjects, selectedUnits]);

    const canManage =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Assignments
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage assignments for your class
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <CreateAssignmentDialog classId={classId ?? ""}>
                                <Button size="lg">
                                    <Plus className="size-4 mr-2" />
                                    <span className="hidden md:inline">
                                        Create Assignment
                                    </span>
                                    <span className="md:hidden">Create</span>
                                </Button>
                            </CreateAssignmentDialog>
                        )}
                    </div>
                </div>
                <div className="w-full space-y-4">
                    <AssignmentsFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        uniqueSubjects={uniqueSubjects}
                        selectedSubjects={selectedSubjects}
                        onSubjectsChange={setSelectedSubjects}
                        uniqueUnits={uniqueUnits}
                        selectedUnits={selectedUnits}
                        onUnitsChange={setSelectedUnits}
                    />
                    <AssignmentsGrid
                        assignments={filteredAssignments}
                        classId={classId ?? ""}
                        isLoading={assignmentsLoading}
                        canManage={canManage}
                        hasActiveFilters={
                            searchQuery.trim() !== "" ||
                            selectedSubjects.size > 0 ||
                            selectedUnits.size > 0
                        }
                        onClearFilters={() => {
                            setSearchQuery("");
                            setSelectedSubjects(new Set());
                            setSelectedUnits(new Set());
                        }}
                    />
                </div>
            </div>
        </RestrictedRoute>
    );
}
