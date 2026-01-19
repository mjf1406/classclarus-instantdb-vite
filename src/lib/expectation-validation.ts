/** @format */

import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Expectation = InstaQLEntity<AppSchema, "expectations">;

/**
 * Validates a student expectation value based on the parent expectation's input type.
 * 
 * @param expectation - The parent expectation entity
 * @param value - The value for 'number' input type (optional)
 * @param minValue - The minimum value for 'numberRange' input type (optional)
 * @param maxValue - The maximum value for 'numberRange' input type (optional)
 * @returns An error message string if validation fails, or null if valid
 */
export function validateStudentExpectationValue(
    expectation: Expectation,
    value?: number | null,
    minValue?: number | null,
    maxValue?: number | null
): string | null {
    if (expectation.inputType === "number") {
        // For 'number' type, value must be provided and be a valid number
        if (value === undefined || value === null) {
            return "Value is required for number type expectations";
        }
        if (Number.isNaN(value)) {
            return "Value must be a valid number";
        }
        return null;
    } else if (expectation.inputType === "numberRange") {
        // For 'numberRange' type, both minValue and maxValue must be provided and valid
        if (minValue === undefined || minValue === null) {
            return "Minimum value is required for number range type expectations";
        }
        if (maxValue === undefined || maxValue === null) {
            return "Maximum value is required for number range type expectations";
        }
        if (Number.isNaN(minValue)) {
            return "Minimum value must be a valid number";
        }
        if (Number.isNaN(maxValue)) {
            return "Maximum value must be a valid number";
        }
        if (minValue > maxValue) {
            return "Minimum value must be less than or equal to maximum value";
        }
        return null;
    }

    return "Unknown input type";
}
