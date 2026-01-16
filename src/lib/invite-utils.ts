/** @format */

/**
 * Generates a 6-character join code using the allowed character set.
 * Pattern: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no I, O, 0, 1 to avoid confusion)
 *
 * @returns A 6-character uppercase code
 */
export function generateJoinCode(): string {
    const allowedChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * allowedChars.length);
        code += allowedChars[randomIndex];
    }

    return code;
}
