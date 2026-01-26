/** @format */

import { CardActionMenu } from "@/routes/classes/_classesLayout/$classId/behavior/-components/card-action-menu";
import { EditAssignmentDialog } from "./edit-assignment-dialog";
import { DeleteAssignmentDialog } from "./delete-assignment-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type AssignmentEntity = InstaQLEntity<AppSchema, "assignments">;

interface AssignmentActionMenuProps {
    assignment: AssignmentEntity;
    classId: string;
}

export function AssignmentActionMenu({
    assignment,
    classId,
}: AssignmentActionMenuProps) {
    return (
        <CardActionMenu>
            <EditAssignmentDialog
                assignment={assignment}
                classId={classId}
                asDropdownItem
            >
                Edit
            </EditAssignmentDialog>
            <DeleteAssignmentDialog assignment={assignment} asDropdownItem>
                Delete
            </DeleteAssignmentDialog>
        </CardActionMenu>
    );
}
