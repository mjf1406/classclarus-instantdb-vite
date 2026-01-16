/** @format */

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
import { useNavigate } from "@tanstack/react-router";

export function JoinForm() {
    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const lastSubmittedCodeRef = useRef<string>("");

    const handleSubmit = useCallback(
        async (e?: React.FormEvent) => {
            if (e) {
                e.preventDefault();
            }

            const codeUpper = code.toUpperCase();
            if (
                code.length !== 6 ||
                lastSubmittedCodeRef.current === codeUpper ||
                isSubmitting
            ) {
                return;
            }

            if (!user?.id) {
                setError("You must be logged in to join an organization");
                return;
            }

            setIsSubmitting(true);
            setError(null);
            lastSubmittedCodeRef.current = codeUpper;

            try {
                console.log("[Join Form] Attempting to join with code:", codeUpper);
                console.log("[Join Form] User ID:", user.id);

                // Query for the organization with this join code
                const query = {
                    orgJoinCodes: {
                        $: {
                            where: { code: codeUpper },
                        },
                        organization: {
                            owner: {},
                        },
                    },
                };
                console.log("[Join Form] Query:", JSON.stringify(query, null, 2));

                const { data } = await db.queryOnce(query);
                console.log("[Join Form] Query response:", data);

                const joinCode = data?.orgJoinCodes?.[0];
                console.log("[Join Form] Join code found:", joinCode);
                console.log("[Join Form] Join code ID:", joinCode?.id);
                console.log("[Join Form] Join code value:", joinCode?.code);

                const organization = joinCode?.organization;
                console.log("[Join Form] Organization found:", organization);
                console.log("[Join Form] Organization ID:", organization?.id);
                console.log("[Join Form] Organization name:", organization?.name);

                if (!organization) {
                    console.error("[Join Form] Invalid join code - no organization found");
                    console.error("[Join Form] Details:", {
                        enteredCode: codeUpper,
                        joinCodeFound: !!joinCode,
                        joinCodeId: joinCode?.id,
                        joinCodeValue: joinCode?.code,
                        organization: organization,
                        allJoinCodes: data?.orgJoinCodes,
                    });
                    setError("Invalid join code. Please check and try again.");
                    return;
                }

                // Check if user is already a member
                const { data: userOrgs } = await db.queryOnce({
                    $users: {
                        $: { where: { id: user.id } },
                        teacherOrganizations: {
                            $: { where: { id: organization.id } },
                        },
                        adminOrganizations: {
                            $: { where: { id: organization.id } },
                        },
                    },
                });

                const userData = userOrgs?.$users?.[0];
                const isAlreadyTeacher =
                    userData?.teacherOrganizations?.some(
                        (org) => org.id === organization.id
                    );
                const isAlreadyAdmin = userData?.adminOrganizations?.some(
                    (org) => org.id === organization.id
                );
                const isOwner = organization.owner?.id === user.id;

                if (isOwner || isAlreadyAdmin || isAlreadyTeacher) {
                    setError("You are already a member of this organization.");
                    return;
                }

                // Add user as a teacher to the organization
                db.transact([
                    db.tx.organizations[organization.id].link({
                        orgTeachers: user.id,
                    }),
                ]);

                // Navigate to the organization
                navigate({
                    to: "/organizations/$orgId",
                    params: { orgId: organization.id },
                });
            } catch (err) {
                console.error("[Join Form] Error joining organization:", err);
                console.error("[Join Form] Error details:", {
                    code: codeUpper,
                    userId: user?.id,
                    error: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined,
                });
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to join organization. Please try again."
                );
            } finally {
                setIsSubmitting(false);
            }
        },
        [code, user?.id, isSubmitting, navigate]
    );

    // Pattern for allowed characters: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
    const allowedPattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*$/;

    const handleChange = (value: string) => {
        // Filter out any characters not in the allowed set
        const filtered = value
            .toUpperCase()
            .split("")
            .filter((char) => allowedPattern.test(char))
            .join("")
            .slice(0, 6);
        setCode(filtered);
        // Reset error when user types
        if (error) {
            setError(null);
        }
        // Reset last submitted code when code changes (so it can be resubmitted)
        if (lastSubmittedCodeRef.current !== filtered) {
            lastSubmittedCodeRef.current = "";
        }
    };

    // Auto-submit when code is complete
    useEffect(() => {
        const codeUpper = code.toUpperCase();
        if (
            code.length === 6 &&
            lastSubmittedCodeRef.current !== codeUpper &&
            !isSubmitting
        ) {
            // Use a small delay to ensure the state is updated
            const timeoutId = setTimeout(() => {
                handleSubmit();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [code, isSubmitting, handleSubmit]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Join</CardTitle>
                    <CardDescription>
                        Enter your 6-character join code
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center">
                            <InputOTP
                                maxLength={6}
                                value={code}
                                onChange={handleChange}
                                autoFocus
                                inputMode="text"
                                pattern="[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]*"
                                disabled={isSubmitting}
                            >
                                <InputOTPGroup className="bg-background">
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        {error && (
                            <div className="text-sm text-destructive text-center">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={code.length < 6 || isSubmitting}
                            size="lg"
                        >
                            {isSubmitting ? "Joining..." : "Join"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
