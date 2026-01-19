/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export function RandomCaseStudy() {
    return (
        <Collapsible defaultOpen={false}>
            <Card className="w-full">
                <CollapsibleTrigger className="w-full">
                    <CardContent className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <span className="font-medium">Case Study</span>
                        </div>
                        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="text-muted-foreground space-y-4">
                            <p className="text-sm">
                                Jeremy teaches 28 students split into two groups of 14, but he only teaches one group at a time and has 14 identical Chromebooks. The groups change every month, so devices must be reassigned while still being tracked. Jeremy uses Random to distribute the Chromebooks each month and keep a clear record of who received which device across both groups.
                            </p>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-foreground text-sm">
                                    Why Random is the right choice for Jeremy
                                </h4>
                                <p className="text-sm">
                                Jeremy’s Chromebooks are identical, so there is no concept of experience, turns, or progression. Because the devices are interchangeable, fairness is achieved simply by avoiding bias. Rotating and Equitable both introduce unnecessary structure when there is nothing meaningful to balance.
                                </p>
                                <p className="text-sm">
                                Random assigns devices without favoritism while still keeping a record of who received which Chromebook. This makes it the simplest and most appropriate choice for identical, trackable resources.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
