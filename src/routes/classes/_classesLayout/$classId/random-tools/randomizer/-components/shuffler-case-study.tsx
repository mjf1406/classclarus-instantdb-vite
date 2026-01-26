/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function ShufflerCaseStudy() {
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
                                Mr. Smith's class does regular presentations once per month. He uses the Shuffler to randomly order the students for the presentations. He knows it's fair because the Shuffler ensures all students go first and last at least once before any single students goes first or last again.
                            </p>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
