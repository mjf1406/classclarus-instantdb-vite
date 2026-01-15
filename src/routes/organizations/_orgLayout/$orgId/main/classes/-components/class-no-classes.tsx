/** @format */

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function ClassNoClasses() {
    return (
        <Card className="border-dashed max-w-md space-y-4 mx-auto">
            <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-center">
                    <BookOpen className="size-24 text-muted-foreground" />
                </div>
                <CardTitle>No classes yet</CardTitle>
                <CardDescription>
                    <div className="max-w-sm mx-auto">
                        Classes are where you organize your students, assignments,
                        and course materials. Create your first class to get
                        started.
                    </div>
                </CardDescription>
            </CardHeader>
        </Card>
    );
}
