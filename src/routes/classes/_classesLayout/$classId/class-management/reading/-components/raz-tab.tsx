/** @format */

import { useState } from "react";
import { db } from "@/lib/db/db";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TestTime } from "./test-time";
import { RazDataTable } from "./raz-data-table";
import type { AppSchema } from "@/instant.schema";
import type { InstaQLEntity } from "@instantdb/react";

interface RazTabProps {
    classId: string;
    userId: string;
}

type ClassRosterWithAssessments = InstaQLEntity<
    AppSchema,
    "class_roster",
    { razAssessments: {}; student: {} }
>;

type RazAssessmentWithRelations = InstaQLEntity<
    AppSchema,
    "raz_assessments",
    { student: {}; createdBy: {} }
>;

export function RazTab({ classId, userId }: RazTabProps) {
    const [activeTab, setActiveTab] = useState<string>("test-time");

    // Query class roster with their RAZ assessments
    const { data: rosterData, isLoading: rosterLoading } = db.useQuery(
        classId
            ? {
                  class_roster: {
                      $: { where: { "class.id": classId } },
                      razAssessments: {},
                      student: {},
                  },
              }
            : null
    );

    // Query all RAZ assessments for the data table view
    const { data: assessmentsData, isLoading: assessmentsLoading } = db.useQuery(
        classId
            ? {
                  raz_assessments: {
                      $: {
                          where: { "class.id": classId },
                          order: { date: "desc" as const },
                      },
                      student: {},
                      createdBy: {},
                  },
              }
            : null
    );

    const roster = (rosterData?.class_roster ?? []) as unknown as ClassRosterWithAssessments[];
    const assessments = (assessmentsData?.raz_assessments ?? []) as unknown as RazAssessmentWithRelations[];

    const isLoading = rosterLoading || assessmentsLoading;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        );
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="test-time">Test Time</TabsTrigger>
                <TabsTrigger value="data">Assessment Data</TabsTrigger>
            </TabsList>
            <TabsContent value="test-time" className="mt-2">
                <TestTime classId={classId} roster={roster} userId={userId} />
            </TabsContent>
            <TabsContent value="data" className="mt-2">
                <RazDataTable assessments={assessments} roster={roster} />
            </TabsContent>
        </Tabs>
    );
}
