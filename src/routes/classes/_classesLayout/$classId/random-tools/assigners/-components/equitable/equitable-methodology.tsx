/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function EquitableMethodology() {
    const [open, setOpen] = useState(false);
    
    return (
        <Collapsible className="group/collapsible" open={open} onOpenChange={setOpen}>
            <Card className="w-full">
                <CollapsibleTrigger className="w-full">
                    <CardContent className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <span className="font-medium">Methodology</span>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="text-muted-foreground space-y-4">
                            <p className="text-sm">
                                The Equitable assigner ensures long-term fairness by tracking each student's experience and prioritizing those who need more opportunities. Here's how it works:
                            </p>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 1: Review Assignment History
                                </h4>
                                <p className="text-sm">
                                    The system looks at all previous assignments to calculate how many times each student has been assigned items overall, and how many times each student has done each specific item.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 2: Identify Students Needing Experience
                                </h4>
                                <p className="text-sm">
                                    Students are ranked by their total experience—those who have been assigned items the fewest times overall are prioritized first. This ensures that over time, every student gets roughly the same number of opportunities.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 3: Match Students to Items They've Done Least
                                </h4>
                                <p className="text-sm">
                                    For each student, the system identifies which items they've done the fewest times (or never done). Students are then assigned to items that will balance their experience, ensuring everyone eventually tries everything.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Optional: Gender Balancing
                                </h4>
                                <p className="text-sm">
                                    If gender balancing is enabled, the system maintains separate experience tracking for boys and girls. This ensures equal opportunities across genders while still balancing individual student experience within each group.
                                </p>
                                <div className="pt-2 border-t">
                                    <p className="text-xs italic">
                                        <strong>Why this works:</strong> Equitable assignment adapts to changing group membership by focusing on long-term balance rather than short-term rotation. New students automatically get priority, and the system ensures that over many assignments, everyone ends up with similar experience across all items. This makes it perfect for situations where groups change frequently or you want to ensure comprehensive experience for all students.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
