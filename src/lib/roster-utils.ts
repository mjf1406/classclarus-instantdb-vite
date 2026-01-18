/** @format */

export function displayNameForStudent(
    user: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    },
    roster?: {
        firstName?: string | null;
        lastName?: string | null;
    } | null
): string {
    const first = (roster?.firstName ?? user.firstName ?? "").trim();
    const last = (roster?.lastName ?? user.lastName ?? "").trim();
    const full = `${first} ${last}`.trim();
    return full || (user.email ?? "Unknown User");
}
