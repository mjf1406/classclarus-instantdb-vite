/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function RandomMethodology() {
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
                                The Random assigner uses the <a href="https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle" target="_blank" className="underline" >Fisher-Yates</a> shuffling algorithm to ensure every assignment is completely unbiased. Here's how it works:
                            </p>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 1: Shuffle the Items
                                </h4>
                                <p className="text-sm">
                                    All items are shuffled into a random order using a method that guarantees every possible arrangement has an equal chance of occurring. This eliminates any patterns or predictability.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 2: Match with Students
                                </h4>
                                <p className="text-sm">
                                    The shuffled items are then paired with students in order. If you have more items than students, only the first items (equal to the number of students) are assigned. If you have more students than items, only the first students (equal to the number of items) receive assignments.
                                </p>
                                <h4 className="font-semibold text-foreground text-sm">
                                    Step 3: Record the Results
                                </h4>
                                <p className="text-sm">
                                    Each assignment is recorded with a timestamp, creating a clear history of who received which item and when. This makes it easy to track assignments over time, even though the assignments themselves are random.
                                </p>
                                <div className="pt-2 border-t">
                                    <p className="text-xs italic">
                                        <strong>Why this works:</strong> Random assignment is the fairest approach when items are identical and there's no need to balance experience or maintain a specific order. It prevents any unconscious bias and ensures every student has an equal chance of receiving any item.
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
