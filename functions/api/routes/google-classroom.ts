/** @format */

import { Hono } from "hono";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { HonoContext } from "../types";
import type { Env } from "../types";

// Google OAuth 2.0 configuration
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1";
const SCOPES = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
].join(" ");

// Generate a state token with user ID encoded
function generateStateToken(userId: string): string {
    const random = Math.random().toString(36).substring(2, 15);
    // Use btoa for base64 encoding (works in Cloudflare Workers)
    const encoded = btoa(userId).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    return `${encoded}.${random}`;
}

// Extract user ID from state token
function extractUserIdFromState(state: string): string | null {
    try {
        const parts = state.split(".");
        if (parts.length !== 2) return null;
        // Use atob for base64 decoding (works in Cloudflare Workers)
        const base64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
        const userId = atob(base64);
        return userId;
    } catch {
        return null;
    }
}

// Get Google OAuth credentials from environment
function getGoogleCredentials(env: Env) {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const redirectUri = env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error(
            "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables."
        );
    }

    return { clientId, clientSecret, redirectUri };
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
): Promise<{ access_token: string; refresh_token: string }> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    });

    if (!response.ok) {
        let errorMessage = "Token exchange failed";
        try {
            const errorData = await response.json();
            errorMessage = errorData.error_description || errorData.error || errorMessage;
        } catch {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.refresh_token) {
        throw new Error("No refresh token received. Please try again and ensure you grant all permissions.");
    }
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
    };
}

// Get access token using refresh token
async function getAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
): Promise<string> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
        }),
    });

    if (!response.ok) {
        let errorMessage = "Token refresh failed";
        try {
            const errorData = await response.json();
            if (errorData.error === "invalid_grant") {
                errorMessage = "Google account connection expired. Please reconnect your Google account.";
            } else {
                errorMessage = errorData.error_description || errorData.error || errorMessage;
            }
        } catch {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.access_token) {
        throw new Error("No access token received");
    }
    return data.access_token;
}

// Make authenticated request to Google Classroom API
async function makeClassroomRequest(
    endpoint: string,
    accessToken: string
): Promise<any> {
    const response = await fetch(`${GOOGLE_CLASSROOM_API_BASE}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        let errorMessage = "Google Classroom API error";
        try {
            const errorData = await response.json();
            if (response.status === 403) {
                errorMessage = "Permission denied. Please ensure you have access to Google Classroom and the required permissions are granted.";
            } else if (response.status === 404) {
                errorMessage = "Classroom resource not found. It may have been deleted or you don't have access.";
            } else if (response.status === 429) {
                errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
            } else {
                errorMessage = errorData.error?.message || errorData.error || errorMessage;
            }
        } catch {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

export function createGoogleClassroomRoute(app: Hono<HonoContext>) {
    // POST /api/google-classroom/connect - Initiate OAuth flow
    app.post("/api/google-classroom/connect", async (c) => {
        try {
            const env = (c.env as Env) || {};
            const dbAdmin = c.get("dbAdmin") as ReturnType<
                typeof initDbAdmin
            >;
            const userId = c.get("userId") as string;

            const { clientId, redirectUri } = getGoogleCredentials(env);
            const state = generateStateToken(userId);

            const authUrl = new URL(GOOGLE_AUTH_URL);
            authUrl.searchParams.set("client_id", clientId);
            authUrl.searchParams.set("redirect_uri", redirectUri);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", SCOPES);
            authUrl.searchParams.set("access_type", "offline");
            authUrl.searchParams.set("prompt", "consent");
            authUrl.searchParams.set("state", state);

            return c.json({
                authUrl: authUrl.toString(),
                state,
            });
        } catch (error) {
            console.error("[Google Classroom Connect] Error:", error);
            return c.json(
                {
                    error: "Failed to initiate OAuth",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    });

    // GET /api/google-classroom/callback - Handle OAuth callback
    // This endpoint is called by Google, so it doesn't use auth middleware
    app.get("/api/google-classroom/callback", async (c) => {
        try {
            const env = (c.env as Env) || {};
            const dbAdmin = initDbAdmin(env);

            const code = c.req.query("code");
            const state = c.req.query("state");
            const error = c.req.query("error");

            if (error) {
                return c.redirect(
                    `/?google-error=${encodeURIComponent(error)}`
                );
            }

            if (!code || !state) {
                return c.redirect(
                    `/?google-error=${encodeURIComponent("Missing authorization code or state")}`
                );
            }

            // Extract user ID from state
            const userId = extractUserIdFromState(state);
            if (!userId) {
                return c.redirect(
                    `/?google-error=${encodeURIComponent("Invalid state token")}`
                );
            }

            const { clientId, clientSecret, redirectUri } =
                getGoogleCredentials(env);

            // Exchange code for tokens
            const tokens = await exchangeCodeForTokens(
                code,
                clientId,
                clientSecret,
                redirectUri
            );

            // Store refresh token in user profile
            // Note: In production, encrypt this token
            await dbAdmin.transact([
                dbAdmin.tx.$users[userId].update({
                    googleRefreshToken: tokens.refresh_token,
                }),
            ]);

            // Redirect to success page (frontend will handle this)
            return c.redirect(`/?google-connected=true`);
        } catch (error) {
            console.error("[Google Classroom Callback] Error:", error);
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            return c.redirect(
                `/?google-error=${encodeURIComponent(errorMessage)}`
            );
        }
    });

    // GET /api/google-classroom/classes - List teacher's Google Classroom classes
    app.get("/api/google-classroom/classes", async (c) => {
        try {
            const env = (c.env as Env) || {};
            const dbAdmin = c.get("dbAdmin") as ReturnType<
                typeof initDbAdmin
            >;
            const userId = c.get("userId") as string;

            // Get user's refresh token
            const userQuery = await dbAdmin.query({
                $users: {
                    $: { where: { id: userId } },
                },
            });

            const user = userQuery.$users?.[0];
            if (!user?.googleRefreshToken) {
                return c.json(
                    {
                        error: "Not connected",
                        message:
                            "Google account not connected. Please connect your Google account first.",
                    },
                    401
                );
            }

            const { clientId, clientSecret } = getGoogleCredentials(env);

            // Get access token (handles token refresh automatically)
            let accessToken: string;
            try {
                accessToken = await getAccessToken(
                    user.googleRefreshToken,
                    clientId,
                    clientSecret
                );
            } catch (error) {
                // If token refresh fails, user needs to reconnect
                if (error instanceof Error && error.message.includes("expired")) {
                    // Clear the invalid token
                    await dbAdmin.transact([
                        dbAdmin.tx.$users[userId].update({
                            googleRefreshToken: undefined,
                        }),
                    ]);
                }
                throw error;
            }

            // Fetch classes
            const classesData = await makeClassroomRequest(
                "/courses?courseStates=ACTIVE",
                accessToken
            );

            return c.json({
                classes: classesData.courses || [],
            });
        } catch (error) {
            console.error("[Google Classroom Classes] Error:", error);
            return c.json(
                {
                    error: "Failed to fetch classes",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    });

    // GET /api/google-classroom/students/:classroomId - Fetch students from a Classroom class
    app.get("/api/google-classroom/students/:classroomId", async (c) => {
        try {
            const env = (c.env as Env) || {};
            const dbAdmin = c.get("dbAdmin") as ReturnType<
                typeof initDbAdmin
            >;
            const userId = c.get("userId") as string;
            const classroomId = c.req.param("classroomId");

            if (!classroomId) {
                return c.json(
                    {
                        error: "Missing classroom ID",
                        message: "Classroom ID is required",
                    },
                    400
                );
            }

            // Get user's refresh token
            const userQuery = await dbAdmin.query({
                $users: {
                    $: { where: { id: userId } },
                },
            });

            const user = userQuery.$users?.[0];
            if (!user?.googleRefreshToken) {
                return c.json(
                    {
                        error: "Not connected",
                        message:
                            "Google account not connected. Please connect your Google account first.",
                    },
                    401
                );
            }

            const { clientId, clientSecret } = getGoogleCredentials(env);

            // Get access token
            const accessToken = await getAccessToken(
                user.googleRefreshToken,
                clientId,
                clientSecret
            );

            // Fetch students
            const studentsData = await makeClassroomRequest(
                `/courses/${classroomId}/students`,
                accessToken
            );

            // Transform students data
            const students =
                studentsData.students?.map((student: any) => {
                    const profile = student.profile || {};
                    return {
                        email: profile.emailAddress || "",
                        firstName: profile.name?.givenName || "",
                        lastName: profile.name?.familyName || "",
                    };
                }) || [];

            return c.json({
                students,
            });
        } catch (error) {
            console.error("[Google Classroom Students] Error:", error);
            return c.json(
                {
                    error: "Failed to fetch students",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    });

    // POST /api/google-classroom/import - Import students as pending members
    app.post("/api/google-classroom/import", async (c) => {
        try {
            const env = (c.env as Env) || {};
            const dbAdmin = c.get("dbAdmin") as ReturnType<
                typeof initDbAdmin
            >;
            const userId = c.get("userId") as string;

            const body = await c.req.json();
            const { classroomId, targetClassId, role } = body;

            if (!classroomId || !targetClassId || !role) {
                return c.json(
                    {
                        error: "Missing parameters",
                        message:
                            "classroomId, targetClassId, and role are required",
                    },
                    400
                );
            }

            // Verify user has permission to manage the target class
            const classQuery = await dbAdmin.query({
                classes: {
                    $: { where: { id: targetClassId } },
                    owner: {},
                    classAdmins: {},
                    classTeachers: {},
                },
            });

            const classEntity = classQuery.classes?.[0];
            if (!classEntity) {
                return c.json(
                    {
                        error: "Class not found",
                        message: "Target class not found",
                    },
                    404
                );
            }

            const isOwner = classEntity.owner?.id === userId;
            const isAdmin = classEntity.classAdmins?.some(
                (admin: any) => admin.id === userId
            );
            const isTeacher = classEntity.classTeachers?.some(
                (teacher: any) => teacher.id === userId
            );

            if (!isOwner && !isAdmin && !isTeacher) {
                return c.json(
                    {
                        error: "Permission denied",
                        message:
                            "You don't have permission to import students to this class",
                    },
                    403
                );
            }

            // Get user's refresh token
            const userQuery = await dbAdmin.query({
                $users: {
                    $: { where: { id: userId } },
                },
            });

            const user = userQuery.$users?.[0];
            if (!user?.googleRefreshToken) {
                return c.json(
                    {
                        error: "Not connected",
                        message:
                            "Google account not connected. Please connect your Google account first.",
                    },
                    401
                );
            }

            const { clientId, clientSecret } = getGoogleCredentials(env);

            // Get access token
            const accessToken = await getAccessToken(
                user.googleRefreshToken,
                clientId,
                clientSecret
            );

            // Fetch students from Google Classroom
            const studentsData = await makeClassroomRequest(
                `/courses/${classroomId}/students`,
                accessToken
            );

            const students =
                studentsData.students?.map((student: any) => {
                    const profile = student.profile || {};
                    return {
                        email: (profile.emailAddress || "").toLowerCase().trim(),
                        firstName: profile.name?.givenName || "",
                        lastName: profile.name?.familyName || "",
                    };
                }) || [];

            // Get existing class members and pending members
            const existingMembersQuery = await dbAdmin.query({
                classes: {
                    $: { where: { id: targetClassId } },
                    classStudents: {
                        $: {},
                    },
                },
                pendingMembers: {
                    $: {
                        where: {
                            class: { id: targetClassId },
                            role: role,
                        },
                    },
                },
            });

            const existingStudents =
                existingMembersQuery.classes?.[0]?.classStudents || [];
            const existingPendingMembers =
                existingMembersQuery.pendingMembers || [];

            const existingEmails = new Set([
                ...existingStudents.map((s: any) =>
                    (s.email || "").toLowerCase().trim()
                ),
                ...existingPendingMembers.map((p: any) =>
                    (p.email || "").toLowerCase().trim()
                ),
            ]);

            // Filter out students who already exist
            const newStudents = students.filter(
                (s: any) => s.email && !existingEmails.has(s.email)
            );

            // Create pending members
            const transactions = newStudents.map((student: any) => {
                const pendingMemberId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                return dbAdmin.tx.pendingMembers[pendingMemberId].create({
                    email: student.email,
                    firstName: student.firstName || undefined,
                    lastName: student.lastName || undefined,
                    role: role,
                    source: "google_classroom",
                    createdAt: new Date(),
                }).link({
                    class: targetClassId,
                });
            });

            if (transactions.length > 0) {
                await dbAdmin.transact(transactions);
            }

            return c.json({
                success: true,
                imported: newStudents.length,
                skipped: students.length - newStudents.length,
                pending: newStudents.length,
            });
        } catch (error) {
            console.error("[Google Classroom Import] Error:", error);
            return c.json(
                {
                    error: "Import failed",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    });
}
