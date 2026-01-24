/** @format */

/**
 * Sanitization utilities for user data exports
 * Removes security-critical fields, sanitizes other users' PII, and flattens nested references
 */

/**
 * Security-critical fields that should never be exported
 */
const SECURITY_FIELDS = [
    "googleRefreshToken",
    "polarCustomerId",
    "studentCode",
    "teacherCode",
    "guardianCode",
    "code",
] as const;

/**
 * Fields to keep for other users (not the exporting user)
 */
const OTHER_USER_ALLOWED_FIELDS = [
    "id",
    "firstName",
    "lastName",
    "displayNameForStudents",
    "displayNameForParents",
] as const;

/**
 * Nested reference fields to flatten to IDs
 */
const REFERENCE_FIELDS_TO_FLATTEN = [
    { nested: "class", idField: "classId" },
    { nested: "behavior", idField: "behaviorId" },
    { nested: "student", idField: "studentId" },
    { nested: "createdBy", idField: "createdById" },
    { nested: "rewardItem", idField: "rewardItemId" },
    { nested: "expectation", idField: "expectationId" },
    { nested: "folder", idField: "folderId" },
    { nested: "group", idField: "groupId" },
    { nested: "organization", idField: "organizationId" },
    { nested: "owner", idField: "ownerId" },
    { nested: "user", idField: "userId" },
] as const;

/**
 * Recursively remove security-critical fields from an object
 */
function removeSecurityFields(obj: any): void {
    if (!obj || typeof obj !== "object") {
        return;
    }

    if (Array.isArray(obj)) {
        obj.forEach((item) => removeSecurityFields(item));
        return;
    }

    // Remove security fields
    for (const field of SECURITY_FIELDS) {
        delete obj[field];
    }

    // Recursively process nested objects
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            removeSecurityFields(obj[key]);
        }
    }
}

/**
 * Check if an object represents a user entity
 */
function isUserEntity(obj: any): boolean {
    return (
        obj &&
        typeof obj === "object" &&
        (obj.id !== undefined || obj.email !== undefined || obj.firstName !== undefined)
    );
}

/**
 * Sanitize user data - keep only allowed fields for users other than the exporting user
 */
function sanitizeUserData(user: any, exportingUserId: string): any {
    if (!user || typeof user !== "object") {
        return user;
    }

    // If this is the exporting user, keep all data (except security fields already removed)
    if (user.id === exportingUserId) {
        return user;
    }

    // For other users, keep only allowed fields
    const sanitized: any = {};
    for (const field of OTHER_USER_ALLOWED_FIELDS) {
        if (user[field] !== undefined) {
            sanitized[field] = user[field];
        }
    }

    return sanitized;
}

/**
 * Recursively sanitize other users' data throughout the object tree
 */
function sanitizeOtherUsers(obj: any, exportingUserId: string): void {
    if (!obj || typeof obj !== "object") {
        return;
    }

    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            if (isUserEntity(item)) {
                obj[index] = sanitizeUserData(item, exportingUserId);
            } else {
                sanitizeOtherUsers(item, exportingUserId);
            }
        });
        return;
    }

    // Check if this object itself is a user entity
    if (isUserEntity(obj)) {
        const sanitized = sanitizeUserData(obj, exportingUserId);
        // Replace the object's properties with sanitized version
        if (obj.id !== exportingUserId) {
            // For other users, replace with sanitized version
            Object.keys(obj).forEach((key) => {
                delete obj[key];
            });
            Object.assign(obj, sanitized);
        }
        // For exporting user, keep as is (security fields already removed)
    }

    // Recursively process nested objects
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (isUserEntity(value)) {
                obj[key] = sanitizeUserData(value, exportingUserId);
            } else {
                sanitizeOtherUsers(value, exportingUserId);
            }
        }
    }
}

/**
 * Flatten nested reference objects to just their IDs
 */
function flattenNestedReferences(obj: any): void {
    if (!obj || typeof obj !== "object") {
        return;
    }

    if (Array.isArray(obj)) {
        obj.forEach((item) => flattenNestedReferences(item));
        return;
    }

    // Check each reference field
    for (const { nested, idField } of REFERENCE_FIELDS_TO_FLATTEN) {
        // Skip if ID field already exists (already flattened)
        if (obj[idField] !== undefined) {
            // Still remove nested object if it exists
            if (obj[nested]) {
                delete obj[nested];
            }
            continue;
        }
        
        if (obj[nested] && typeof obj[nested] === "object") {
            // Extract the ID
            const id = obj[nested].id;
            if (id !== undefined) {
                obj[idField] = id;
            }
            // Remove the nested object
            delete obj[nested];
        }
    }

    // Recursively process nested objects (but skip arrays of references we just flattened)
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            // Skip if this is an ID field we just created
            if (REFERENCE_FIELDS_TO_FLATTEN.some((ref) => ref.idField === key)) {
                continue;
            }
            flattenNestedReferences(value);
        }
    }
}

/**
 * Main sanitization function that applies all cleanup steps
 */
export function sanitizeExportData(data: any, exportingUserId: string): any {
    // Deep clone to avoid mutating the original data
    const sanitized = structuredClone(data);

    // Step 1: Remove security-critical fields globally
    removeSecurityFields(sanitized);

    // Step 2: Sanitize other users' PII
    sanitizeOtherUsers(sanitized, exportingUserId);

    // Step 3: Flatten nested references to IDs
    flattenNestedReferences(sanitized);

    return sanitized;
}
