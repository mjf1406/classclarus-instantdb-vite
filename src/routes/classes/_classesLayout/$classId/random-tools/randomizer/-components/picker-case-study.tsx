/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function PickerCaseStudy() {
    const [open, setOpen] = useState(false);
    
    return (
        <Collapsible className="group/collapsible" open={open} onOpenChange={setOpen}>
            <Card className="w-full">
                <CollapsibleTrigger className="w-full">
                    <CardContent className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <span className="font-medium">Case Study</span>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="text-muted-foreground space-y-4">
                            <p className="text-sm">
                                Mrs. Smith has one student help her on Fridays with a small cleanup task. She uses the Picker to randomly select the student for the task. She knows it's fair because the Picker ensures all students get a chance to help her and she knows the state is preserved between picks and will only reset when she starts a new round or all students have been picked.
                            </p>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
