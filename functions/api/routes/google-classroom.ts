/** @format */

import { Hono } from "hono";
import { id } from "@instantdb/admin";
import { initDbAdmin } from "../../../src/lib/db/db-admin";
import type { HonoContext } from "../types";
import type { Env } from "../types";
import { getGuardianLinkTransactions } from "../../../src/lib/guardian-utils";

// Google OAuth 2.0 configuration
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1";
const SCOPES = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
    "https://www.googleapis.com/auth/classroom.profile.emails",
].join(" ");


// Get Google OAuth credentials from environment
function getGoogleCredentials(env: Env) {
    const clientId = env.GC_CLIENT;
    const clientSecret = env.GC_SECRET;
    const redirectUri = env.GC_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error(
            "Google OAuth credentials not configured. Please set GC_CLIENT, GC_SECRET, and GC_REDIRECT_URI environment variables."
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
    // POST /api/google-classroom/exchange - Exchange authorization code for tokens
    app.post("/api/google-classroom/exchange", async (c) => {
        try {
            const env = (c.env as Env) || {};
            const dbAdmin = c.get("dbAdmin") as ReturnType<
                typeof initDbAdmin
            >;
            const userId = c.get("userId") as string;

            const body = await c.req.json();
            const { code, redirectUri: frontendRedirectUri } = body;

            if (!code) {
                return c.json(
                    {
                        error: "Missing authorization code",
                        message: "Authorization code is required",
                    },
                    400
                );
            }

            const { clientId, clientSecret, redirectUri: backendRedirectUri } =
                getGoogleCredentials(env);

            // Use redirect URI from frontend if provided, otherwise use backend default
            // This ensures compatibility with @react-oauth/google which uses window.location.origin
            const redirectUri = frontendRedirectUri || backendRedirectUri;

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

            return c.json({
                success: true,
                message: "Google Classroom connected successfully",
            });
        } catch (error) {
            console.error("[Google Classroom Exchange] Error:", error);
            return c.json(
                {
                    error: "Failed to exchange authorization code",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
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
            console.log("[Google Classroom Import] Fetching students from classroom:", classroomId);
            const studentsData = await makeClassroomRequest(
                `/courses/${classroomId}/students`,
                accessToken
            );
            console.log("[Google Classroom Import] Students data received:", {
                studentCount: studentsData.students?.length || 0,
                students: studentsData.students?.map((s: any) => ({
                    userId: s.userId,
                    name: s.profile?.name?.fullName,
                })),
            });

            // Fetch email for each student using userProfiles endpoint
            console.log("[Google Classroom Import] Fetching user profiles for", studentsData.students?.length || 0, "students");
            const studentsWithEmails = await Promise.all(
                (studentsData.students || []).map(async (student: any) => {
                    try {
                        console.log(`[Google Classroom Import] Fetching profile for userId: ${student.userId}`);
                        const userProfile = await makeClassroomRequest(
                            `/userProfiles/${student.userId}`,
                            accessToken
                        );
                        console.log(`[Google Classroom Import] Profile fetched for ${student.userId}:`, {
                            email: userProfile.emailAddress,
                            hasEmail: !!userProfile.emailAddress,
                        });
                        return {
                            email: (userProfile.emailAddress || "").toLowerCase().trim(),
                            firstName: student.profile?.name?.givenName || "",
                            lastName: student.profile?.name?.familyName || "",
                        };
                    } catch (error) {
                        console.error(
                            `[Google Classroom Import] Failed to fetch profile for user ${student.userId}:`,
                            error instanceof Error ? error.message : String(error)
                        );
                        // Return student without email if profile fetch fails
                        return {
                            email: "",
                            firstName: student.profile?.name?.givenName || "",
                            lastName: student.profile?.name?.familyName || "",
                        };
                    }
                })
            );

            console.log("[Google Classroom Import] Students with emails:", {
                total: studentsWithEmails.length,
                withEmail: studentsWithEmails.filter((s: any) => s.email).length,
                withoutEmail: studentsWithEmails.filter((s: any) => !s.email).length,
                emails: studentsWithEmails.map((s: any) => s.email),
            });

            // Filter out students without valid email addresses
            const students = studentsWithEmails.filter((s: any) => s.email && s.email.length > 0);
            console.log("[Google Classroom Import] Filtered students (with valid emails):", students.length);

            // Get existing class members and pending members
            const existingMembersQuery = await dbAdmin.query({
                classes: {
                    $: { where: { id: targetClassId } },
                    classStudents: {
                        $: {},
                    },
                    pendingMembers: {},
                },
            });

            const existingStudents =
                existingMembersQuery.classes?.[0]?.classStudents || [];
            const classWithMembers = existingMembersQuery.classes?.[0];
            const allPendingMembers = classWithMembers?.pendingMembers || [];
            // Filter by role client-side since we can't filter linked entities in where clause
            const existingPendingMembers = allPendingMembers.filter(
                (p: any) => p.role === role
            );

            // Normalize and collect existing emails
            const existingStudentEmails = existingStudents
                .map((s: any) => (s.email || "").toLowerCase().trim())
                .filter((email: string) => email.length > 0);
            const existingPendingEmails = existingPendingMembers
                .map((p: any) => (p.email || "").toLowerCase().trim())
                .filter((email: string) => email.length > 0);

            const existingEmailsInClass = new Set([
                ...existingStudentEmails,
                ...existingPendingEmails,
            ]);

            // Query for existing users with matching emails
            const studentEmails = students
                .map((s: any) => s.email.toLowerCase().trim())
                .filter((email: string) => email.length > 0);
            
            const existingUsersQuery = await dbAdmin.query({
                $users: {
                    $: {
                        where: {
                            email: { $in: studentEmails },
                        },
                    },
                },
            });
            const existingUsers = existingUsersQuery.$users || [];
            const existingUserEmails = new Set(
                existingUsers.map((u: any) => (u.email || "").toLowerCase().trim())
            );

            // Categorize students
            const studentsInClass = students.filter((s: any) =>
                existingEmailsInClass.has(s.email.toLowerCase().trim())
            );
            const studentsAsUsers = students.filter(
                (s: any) =>
                    existingUserEmails.has(s.email.toLowerCase().trim()) &&
                    !existingEmailsInClass.has(s.email.toLowerCase().trim())
            );
            const newStudents = students.filter(
                (s: any) =>
                    !existingUserEmails.has(s.email.toLowerCase().trim()) &&
                    !existingEmailsInClass.has(s.email.toLowerCase().trim())
            );

            console.log("[Google Classroom Import] Student categorization:", {
                total: students.length,
                inClass: studentsInClass.length,
                asUsers: studentsAsUsers.length,
                new: newStudents.length,
            });

            // Determine link label based on role
            let linkLabel: "classStudents" | "classTeachers" | "classGuardians";
            if (role === "student") {
                linkLabel = "classStudents";
            } else if (role === "teacher") {
                linkLabel = "classTeachers";
            } else {
                linkLabel = "classGuardians";
            }

            // Add existing users directly to class
            const addUserTransactions = studentsAsUsers
                .map((student: any) => {
                    const user = existingUsers.find(
                        (u: any) =>
                            (u.email || "").toLowerCase().trim() ===
                            student.email.toLowerCase().trim()
                    );
                    if (!user) return null;

                    return dbAdmin.tx.classes[targetClassId].link({
                        [linkLabel]: user.id,
                    });
                })
                .filter((tx): tx is NonNullable<typeof tx> => tx !== null);

            // Create pending members for new students
            const pendingMemberTransactions = newStudents.map((student: any) => {
                const pendingMemberId = id();
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

            // If students are being added, ensure roster entries exist with guardian codes and add their guardians to the class
            const guardianTransactions: Array<
                ReturnType<typeof dbAdmin.tx.classes[string]["link"]>
            > = [];
            if (role === "student") {
                // Ensure each student has a roster entry with guardian code
                const codeGenerationPromises = studentsAsUsers
                    .map((student: any) => {
                        const user = existingUsers.find(
                            (u: any) =>
                                (u.email || "").toLowerCase().trim() ===
                                student.email.toLowerCase().trim()
                        );
                        return user?.id;
                    })
                    .filter((userId): userId is string => userId !== undefined)
                    .map(async (userId) => {
                        try {
                            const { ensureRosterHasGuardianCode } = await import(
                                "../../../src/lib/guardian-utils"
                            );
                            await ensureRosterHasGuardianCode(
                                dbAdmin as any,
                                targetClassId,
                                userId
                            );
                        } catch (error) {
                            console.error(
                                `[Google Classroom] Error ensuring roster guardian code for student ${userId} in class ${targetClassId}:`,
                                error
                            );
                            // Don't fail the import if code generation fails
                        }
                    });

                await Promise.all(codeGenerationPromises);

                // Query guardians for each student being added
                const guardianPromises = studentsAsUsers
                    .map((student: any) => {
                        const user = existingUsers.find(
                            (u: any) =>
                                (u.email || "").toLowerCase().trim() ===
                                student.email.toLowerCase().trim()
                        );
                        return user?.id;
                    })
                    .filter((userId): userId is string => userId !== undefined)
                    .map((userId) =>
                        getGuardianLinkTransactions(
                            dbAdmin as any,
                            userId,
                            targetClassId
                        )
                    );

                // Wait for all guardian queries to complete
                const guardianTransactionArrays = await Promise.all(
                    guardianPromises
                );
                // Flatten the arrays into a single array
                guardianTransactions.push(
                    ...guardianTransactionArrays.flat()
                );
            }

            // Execute all transactions in a single operation (all-or-nothing)
            const allTransactions = [
                ...addUserTransactions,
                ...pendingMemberTransactions,
                ...guardianTransactions,
            ];
            if (allTransactions.length > 0) {
                await dbAdmin.transact(allTransactions);
            }

            return c.json({
                success: true,
                imported: studentsAsUsers.length + newStudents.length,
                added: studentsAsUsers.length,
                pending: newStudents.length,
                skipped: studentsInClass.length,
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

    // POST /api/google-classroom/disconnect - Disconnect Google Classroom
    app.post("/api/google-classroom/disconnect", async (c) => {
        try {
            const dbAdmin = c.get("dbAdmin") as ReturnType<
                typeof initDbAdmin
            >;
            const userId = c.get("userId") as string;

            // Clear the refresh token
            await dbAdmin.transact([
                dbAdmin.tx.$users[userId].update({
                    googleRefreshToken: undefined,
                }),
            ]);

            return c.json({
                success: true,
                message: "Google Classroom disconnected successfully",
            });
        } catch (error) {
            console.error("[Google Classroom Disconnect] Error:", error);
            return c.json(
                {
                    error: "Failed to disconnect",
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
