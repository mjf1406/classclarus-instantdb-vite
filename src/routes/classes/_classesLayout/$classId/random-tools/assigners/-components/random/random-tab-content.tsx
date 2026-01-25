/** @format */

import { AssignersList } from "../assigners-list";
import { RandomCaseStudy } from "./random-case-study";
import { RandomMethodology } from "./random-methodology";

interface RandomTabContentProps {
    classId: string;
    canManage: boolean;
}

export function RandomTabContent({
    classId,
    canManage,
}: RandomTabContentProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="space-y-4 w-full max-w-6xl">
                <div className="rounded-lg border bg-card p-6 max-w-2xl mx-auto">
                    <h3 className="block md:hidden text-lg font-semibold mb-2">Random</h3>
                    <p className="text-muted-foreground">
                        Randomly assign identical resources while keeping a clear
                        record of who has what. Ideal for distributing items like
                        Chromebooks, tablets, or other shared equipment.
                    </p>
                </div>
                <div className="max-w-2xl mx-auto space-y-4">
                    <RandomCaseStudy />
                    <RandomMethodology />
                </div>
                <AssignersList assignerType="random" classId={classId} canManage={canManage} />
            </div>
        </div>
    );
}
