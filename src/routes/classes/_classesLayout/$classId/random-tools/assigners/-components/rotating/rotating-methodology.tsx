/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function RotatingMethodology() {
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
                                The Rotating assigner creates predictable, fair assignments by moving students through items in a consistent sequence. Here's how it works:
                            </p>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 1: Track Rotation History
                                </h4>
                                <p className="text-sm">
                                    The system remembers how many times each group or team has been assigned items. This count determines where the rotation starts for the current assignment.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 2: Determine Starting Position
                                </h4>
                                <p className="text-sm">
                                    Based on the rotation history, the system calculates which student should receive the first item. Each time you run the assigner, it shifts forward by one position—like a clock hand moving around a dial. This ensures every student eventually gets a turn.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 3: Assign Items in Order
                                </h4>
                                <p className="text-sm">
                                    Items are assigned in a fixed order. You can choose "front-to-back" (first item to last item) or "back-to-front" (last item to first item). Students are matched to items starting from the calculated rotation position, wrapping around to the beginning if needed.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Optional: Gender Balancing
                                </h4>
                                <p className="text-sm">
                                    If gender balancing is enabled, students are first separated into boys, girls, and others. Each group then follows its own independent rotation, ensuring equal representation across genders while maintaining the predictable rotation pattern within each group.
                                </p>
                                <div className="pt-2 border-t">
                                    <p className="text-xs italic">
                                        <strong>Why this works:</strong> Rotation creates fairness through predictability. Every student knows they'll get a turn, and the order is consistent. This is ideal when groups stay the same and you want a routine that students can anticipate. Each group or team maintains its own rotation, so running assignments for one group doesn't affect another.
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
