/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export function EquitableCaseStudy() {
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
                                Sarah teaches 24 students split into two groups of 12 and has eight classroom jobs to assign. Because the groups change every month, simple rotation no longer stays fair. Sarah uses Equitable to balance experience over time so every student gets a chance at each job.
                            </p>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-foreground text-sm">
                                    Why Equitable is the right choice for Sarah
                                </h4>
                                <p className="text-sm">
                                Sarah’s groups change every month, which means students are constantly entering and leaving assignment pools. A simple rotation would break because new students would skip turns and others would repeat the same jobs. Random would avoid bias, but it would not prevent the same students from repeatedly getting the same jobs over time.
                                </p>
                                <p className="text-sm">
                                Equitable is designed for this situation. It prioritizes students with the least overall experience and then assigns them jobs they’ve done the fewest times. This allows fairness to be preserved even as group membership changes, ensuring long‑term balance rather than short‑term randomness.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
