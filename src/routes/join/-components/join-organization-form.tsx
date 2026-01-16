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
import { Loader2, AlertTriangle } from "lucide-react";

export function JoinOrganizationForm() {
    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const lastSubmittedCodeRef = useRef<string>("");
    const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                setError("You must be logged in to join an organization");
                return;
            }

            setIsSubmitting(true);
            setError(null);
            setIsRateLimited(false);
            lastSubmittedCodeRef.current = codeUpper;

            try {
                // Call the API endpoint
                const response = await fetch("/api/join/organization", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        token: user.refresh_token,
                    },
                    body: JSON.stringify({ code: codeUpper }),
                });

                // Check content-type before parsing JSON
                const contentType = response.headers.get("content-type");
                const isJson = contentType?.includes("application/json");

                let data: any;
                if (isJson) {
                    try {
                        data = await response.json();
                    } catch (parseError) {
                        // If JSON parsing fails, try to get text and parse manually
                        const text = await response.text();
                        try {
                            data = JSON.parse(text);
                        } catch {
                            // If still not JSON, create error object from text
                            data = {
                                error: "Parse Error",
                                message: text || "Failed to parse response",
                            };
                        }
                    }
                } else {
                    // Not JSON, get text response
                    const text = await response.text();
                    data = {
                        error: "Invalid Response",
                        message: text || "Server returned non-JSON response",
                    };
                }

                if (!response.ok) {
                    // Handle different error status codes
                    if (response.status === 401) {
                        setError("Authentication failed. Please log in again.");
                    } else if (response.status === 404) {
                        setError(
                            data.message ||
                                "Invalid organization join code. Please check and try again."
                        );
                    } else if (response.status === 409) {
                        setError(
                            data.message ||
                                "You are already a member of this organization."
                        );
                    } else if (response.status === 429) {
                        setIsRateLimited(true);
                        setError(
                            data.message ||
                                "Too many requests. Please try again in a minute."
                        );
                    } else if (response.status === 400) {
                        setError(data.message || "Invalid code format.");
                    } else {
                        setError(
                            data.message ||
                                "Failed to join organization. Please try again."
                        );
                    }
                    return;
                }

                // Success - show success state and delay navigation
                setIsSubmitting(false);
                setIsSuccess(true);

                // Delay navigation by 500ms to allow InstantDB to sync
                redirectTimeoutRef.current = setTimeout(() => {
                    navigate({
                        to: "/organizations/$orgId",
                        params: { orgId: data.entityId },
                    });
                }, 500);
            } catch (err) {
                console.error("[Join Organization Form] Error joining:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to join organization. Please try again."
                );
            } finally {
                setIsSubmitting(false);
            }
        },
        [code, user?.id, user?.refresh_token, isSubmitting, navigate]
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
        // Reset error and rate limit state when user types
        if (error) {
            setError(null);
        }
        if (isRateLimited) {
            setIsRateLimited(false);
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
            !isSubmitting &&
            !isSuccess
        ) {
            // Use a small delay to ensure the state is updated
            const timeoutId = setTimeout(() => {
                handleSubmit();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [code, isSubmitting, isSuccess, handleSubmit]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, []);

    // Show success state with loading spinner
    if (isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            Successfully Joined!
                        </CardTitle>
                        <CardDescription>
                            You've successfully joined the organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center space-y-4 py-8">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-muted-foreground text-center">
                                Redirecting...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        Join Organization
                    </CardTitle>
                    <CardDescription>
                        Enter your 6-character organization join code
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                        <p className="text-center text-sm font-medium text-yellow-700 dark:text-yellow-400">
                            Be careful! You only get 3 tries!
                        </p>
                    </div>
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
                                disabled={isSubmitting || isSuccess}
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
                            <div className="flex flex-col items-center space-y-2">
                                {isRateLimited && (
                                    <AlertTriangle className="h-16 w-16 text-destructive" />
                                )}
                                <div className="text-sm text-destructive text-center">
                                    {error}
                                </div>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                code.length < 6 || isSubmitting || isSuccess
                            }
                            size="lg"
                        >
                            {isSubmitting ? "Joining..." : "Join Organization"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
