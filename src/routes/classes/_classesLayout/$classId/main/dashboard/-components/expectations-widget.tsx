/** @format */

import { useMemo } from "react";
import { Target } from "lucide-react";
import { useExpectations } from "@/hooks/use-expectations";
import { formatExpectationValue, formatExpectationRange } from "@/lib/format-expectation-value";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
interface ExpectationsWidgetProps {
    classId: string;
    studentId: string;
}

export function ExpectationsWidget({
    classId,
    studentId,
}: ExpectationsWidgetProps) {
    const { expectations, studentExpectationMap, isLoading } = useExpectations(
        classId,
        studentId
    );

    // Combine expectations with student expectation values
    const expectationsWithValues = useMemo(() => {
        return expectations.map((expectation) => {
            const studentExpectation = studentExpectationMap.get(expectation.id);
            return {
                expectation,
                studentExpectation: studentExpectation || null,
            };
        });
    }, [expectations, studentExpectationMap]);

    if (isLoading) {
        return (
            <Card style={{ backgroundColor: "var(--student-card-bg)" }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="size-5 text-primary" />
                        Expectations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    if (expectations.length === 0) {
        return (
            <Card style={{ backgroundColor: "var(--student-card-bg)" }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="size-5 text-primary" />
                        Expectations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <Target className="size-12 mx-auto mb-2 opacity-50" />
                        <p>No expectations set for this class</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card style={{ backgroundColor: "var(--student-card-bg)" }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="size-5 text-primary" />
                    Expectations
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {expectationsWithValues.map(({ expectation, studentExpectation }) => {
                    let displayValue: string = "—";
                    if (expectation.inputType === "number") {
                        if (
                            studentExpectation?.value != null &&
                            !Number.isNaN(studentExpectation.value)
                        ) {
                            displayValue = formatExpectationValue(
                                studentExpectation.value,
                                expectation.unit
                            );
                        }
                    } else {
                        if (
                            studentExpectation?.minValue != null &&
                            studentExpectation?.maxValue != null &&
                            !Number.isNaN(studentExpectation.minValue) &&
                            !Number.isNaN(studentExpectation.maxValue)
                        ) {
                            displayValue = formatExpectationRange(
                                studentExpectation.minValue,
                                studentExpectation.maxValue,
                                expectation.unit
                            );
                        }
                    }

                    return (
                        <div
                            key={expectation.id}
                            className="flex items-start justify-between gap-4 p-3 rounded-lg border"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                        {expectation.name}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {expectation.inputType === "number"
                                            ? "Number"
                                            : "Range"}
                                    </Badge>
                                </div>
                                {expectation.description && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {expectation.description}
                                    </p>
                                )}
                                <div className="text-sm font-semibold">
                                    {displayValue}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
