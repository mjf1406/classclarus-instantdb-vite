/** @format */

/**
 * Natural sort comparator that handles numbers within strings correctly.
 * "1, 2, 10" sorts as 1, 2, 10 (not 1, 10, 2)
 * "Item 1", "Item 10", "Item 2" sorts as Item 1, Item 2, Item 10
 */
export function naturalCompare(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function naturalSort(arr: string[]): string[] {
    return [...arr].sort(naturalCompare);
}
