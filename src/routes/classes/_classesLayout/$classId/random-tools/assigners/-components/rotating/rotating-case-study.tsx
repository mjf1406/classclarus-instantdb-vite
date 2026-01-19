/** @format */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export function RotatingCaseStudy() {
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
                                Cara has a class of 32 students split into stable reading groups of four. She uses Rotating to cycle students through four reading‑time jobs so everyone takes a turn in a predictable order. As long as the groups stay the same, Rotating keeps assignments fair. If group membership changes, she would switch to Equitable to rebalance experience.
                            </p>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-foreground text-sm">
                                Why Rotating is the right choice for Cara
                                </h4>
                                <p className="text-sm">
                                Cara’s reading groups are stable, and the goal is predictability rather than optimization. Every student should cycle through the same set of jobs in a known order. Random would introduce unnecessary variation, and Equitable would overcorrect for a problem that doesn’t exist.
                                </p>
                                <p className="text-sm">
                                Rotating works because group membership does not change. Each run simply shifts the order, guaranteeing that everyone eventually does every job exactly once before repeating. This makes Rotating ideal for routines where consistency matters more than adaptation.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
