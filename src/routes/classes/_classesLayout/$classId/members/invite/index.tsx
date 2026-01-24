/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { useClassRoster } from "@/hooks/use-class-roster";
import { Card, CardContent } from "@/components/ui/card";
import { InviteCodesTabs } from "./-components/invite-codes-tabs";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { GoogleClassroomImportDialog } from "./-components/google-classroom-import-dialog";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { displayNameForStudent } from "@/lib/roster-utils";
import { db } from "@/lib/db/db";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/members/invite/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading: classLoading } =
        useClassById(classId);
    const roleInfo = useClassRole(classEntity);
    const { rosterByStudentId } = useClassRoster(classId);
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    const isLoading = classLoading;
    const hasPermission =
        roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    const handleCopySuccess = (_type: "student" | "teacher" | "guardian") => {
        // Copy success feedback is handled within the sharing buttons
        // This callback can be used for additional actions if needed
    };

    // Get class-level codes
    const codes = classEntity
        ? {
              student: classEntity.studentCode || null,
              teacher: classEntity.teacherCode || null,
              guardian: classEntity.guardianCode || null,
          }
        : { student: null, teacher: null, guardian: null };

    // Query students with their guardians to get the count
    const studentIds = classEntity?.classStudents?.map((s) => s.id) || [];
    const { data: studentsWithGuardiansData } = db.useQuery(
        studentIds.length > 0
            ? {
                  $users: {
                      $: {
                          where: {
                              id: { $in: studentIds },
                          },
                      },
                      guardians: {},
                  },
              }
            : null
    );

    // Create a map of student ID to guardian count
    const guardianCountByStudentId = useMemo(() => {
        const map = new Map<string, number>();
        studentsWithGuardiansData?.$users?.forEach((student) => {
            map.set(student.id, student.guardians?.length || 0);
        });
        return map;
    }, [studentsWithGuardiansData]);

    // Get all students with their guardian codes (if available)
    const studentGuardianCodes = classEntity?.classStudents
        ? classEntity.classStudents.map((student) => {
              const roster = rosterByStudentId.get(student.id);
              return {
                  studentId: student.id,
                  studentName: displayNameForStudent(student, roster ?? null),
                  code: roster?.guardianCode || null,
                  guardianCount: guardianCountByStudentId.get(student.id) || 0,
              };
          })
        : [];

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            {!hasPermission ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserPlus className="size-12 md:size-16 text-primary" />
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                    Invite Members
                                </h1>
                                <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                    Invite new members to your class
                                </p>
                            </div>
                        </div>
                    </div>
                    <Card>
                        <CardContent className="py-6">
                            <p className="text-sm text-muted-foreground text-center">
                                You don't have permission to invite members. Only
                                class owners, admins, and teachers can manage join
                                codes.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserPlus className="size-12 md:size-16 text-primary" />
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                    Invite Members
                                </h1>
                                <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                    Share join codes to invite members to your class
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="size-5 text-primary" />
                                    <div>
                                        <p className="font-medium">
                                            Import from Google Classroom
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Import students directly from your Google Classroom
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setImportDialogOpen(true)}
                                    variant="outline"
                                >
                                    Import Students
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <InviteCodesTabs
                        codes={codes}
                        studentGuardianCodes={studentGuardianCodes}
                        isLoading={isLoading}
                        onCopySuccess={handleCopySuccess}
                        classId={classId}
                        className={classEntity?.name || ""}
                    />

                    {classId && (
                        <GoogleClassroomImportDialog
                            open={importDialogOpen}
                            onOpenChange={setImportDialogOpen}
                            classId={classId}
                            onImportComplete={() => {
                                // Optionally refresh data or show success message
                            }}
                        />
                    )}
                </div>
            )}
        </RestrictedRoute>
    );
}
