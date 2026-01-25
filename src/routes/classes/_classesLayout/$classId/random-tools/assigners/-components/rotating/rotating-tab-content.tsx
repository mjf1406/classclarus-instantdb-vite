/** @format */

import { AssignersList } from "../assigners-list";
import { RotatingCaseStudy } from "./rotating-case-study";

interface RotatingTabContentProps {
    classId: string;
    canManage: boolean;
}

export function RotatingTabContent({
    classId,
    canManage,
}: RotatingTabContentProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="space-y-4 w-full max-w-6xl">
                <div className="rounded-lg border bg-card p-6 max-w-2xl mx-auto">
                    <h3 className="block md:hidden text-lg font-semibold mb-2">Rotating</h3>
                    <p className="text-muted-foreground">
                        Create predictable, repeatable assignments by moving students through a fixed sequence. Rotate left (first to last) or right (last to first) to ensure consistent turn-taking.
                    </p>
                </div>
                <div className="max-w-2xl mx-auto">
                    <RotatingCaseStudy />
                </div>
                <AssignersList assignerType="rotating" classId={classId} canManage={canManage} />
            </div>
        </div>
    );
}
