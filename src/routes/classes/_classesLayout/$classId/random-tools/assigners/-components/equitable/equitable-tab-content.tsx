/** @format */

import { EquitableAssignersList } from "./equitable-assigners-list";
import { EquitableCaseStudy } from "./equitable-case-study";

interface EquitableTabContentProps {
    classId: string;
    canManage: boolean;
}

export function EquitableTabContent({
    classId,
    canManage,
}: EquitableTabContentProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="space-y-4 w-full max-w-6xl">
                <div className="rounded-lg border bg-card p-6 max-w-2xl mx-auto">
                    <h3 className="block md:hidden text-lg font-semibold mb-2">Equitable</h3>
                    <p className="text-muted-foreground">
                        Balances experience across students to produce fair assignments. Prioritizes least‑experienced students first, then assigns what they've done the least, with optional separate balancing for boys and girls. Use this when groups or teams change frequently.
                    </p>
                </div>
                <div className="max-w-2xl mx-auto">
                    <EquitableCaseStudy />
                </div>
                <EquitableAssignersList classId={classId} canManage={canManage} />
            </div>
        </div>
    );
}
