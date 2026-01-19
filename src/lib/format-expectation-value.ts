/** @format */

/**
 * Formats a number value with its unit, converting seconds to a readable format
 * @param value - The numeric value
 * @param unit - The unit string (e.g., "seconds", "minutes", "pages")
 * @returns Formatted string (e.g., "2m 30s" for 150 seconds, or "5 minutes" for other units)
 */
export function formatExpectationValue(value: number, unit: string): string {
    const normalizedUnit = unit.toLowerCase().trim();
    
    // Check if unit is seconds-related
    if (
        normalizedUnit === "seconds" ||
        normalizedUnit === "second" ||
        normalizedUnit === "sec" ||
        normalizedUnit === "secs"
    ) {
        return formatSeconds(value);
    }
    
    // For all other units, return as-is
    return `${value} ${unit}`;
}

/**
 * Formats a range of values with its unit, converting seconds to a readable format
 * @param minValue - The minimum numeric value
 * @param maxValue - The maximum numeric value
 * @param unit - The unit string
 * @returns Formatted string (e.g., "2m 30s - 5m" for ranges in seconds)
 */
export function formatExpectationRange(
    minValue: number,
    maxValue: number,
    unit: string
): string {
    const normalizedUnit = unit.toLowerCase().trim();
    
    // Check if unit is seconds-related
    if (
        normalizedUnit === "seconds" ||
        normalizedUnit === "second" ||
        normalizedUnit === "sec" ||
        normalizedUnit === "secs"
    ) {
        return `${formatSeconds(minValue)} - ${formatSeconds(maxValue)}`;
    }
    
    // For all other units, return as-is
    return `${minValue}-${maxValue} ${unit}`;
}

/**
 * Converts seconds to a human-readable format (e.g., "2m 30s", "1h 15m", "45s")
 * @param totalSeconds - Total number of seconds
 * @returns Formatted string
 */
function formatSeconds(totalSeconds: number): string {
    if (totalSeconds < 0) {
        return `-${formatSeconds(-totalSeconds)}`;
    }
    
    if (totalSeconds === 0) {
        return "0s";
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts: string[] = [];
    
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds}s`);
    }
    
    return parts.join(" ");
}
