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

            if (!user?.id || !user?.refresh_token) {
                setError(
                    "You must be logged in to join an organization or class"
                );
                return;
            }

            setIsSubmitting(true);
            setError(null);
            lastSubmittedCodeRef.current = codeUpper;

            try {
                console.log(
                    "[Join Form] Attempting to join with code:",
                    codeUpper
                );
                console.log("[Join Form] User ID:", user.id);

                // Call the API endpoint
                const response = await fetch("/api/join", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        token: user.refresh_token,
                    },
                    body: JSON.stringify({ code: codeUpper }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // Handle different error status codes
                    if (response.status === 401) {
                        setError("Authentication failed. Please log in again.");
                    } else if (response.status === 404) {
                        setError(
                            data.message ||
                                "Invalid join code. Please check and try again."
                        );
                    } else if (response.status === 409) {
                        setError(data.message || "You are already a member.");
                    } else if (response.status === 429) {
                        setError(
                            data.message ||
                                "Too many requests. Please try again in a minute."
                        );
                    } else if (response.status === 400) {
                        setError(data.message || "Invalid code format.");
                    } else {
                        setError(
                            data.message || "Failed to join. Please try again."
                        );
                    }
                    return;
                }

                // Success - navigate to the appropriate entity
                if (data.entityType === "organization") {
                    navigate({
                        to: "/organizations/$orgId",
                        params: { orgId: data.entityId },
                    });
                } else if (data.entityType === "class") {
                    // Navigate to the class - need to get the orgId from the class
                    // For now, navigate to classes list or the class directly if we have the route
                    navigate({
                        to: "/classes/$classId",
                        params: { classId: data.entityId },
                    });
                } else {
                    // Fallback - just show success message
                    setError(null);
                    console.log("[Join Form] Success:", data.message);
                }
            } catch (err) {
                console.error("[Join Form] Error joining:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to join. Please try again."
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
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
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
