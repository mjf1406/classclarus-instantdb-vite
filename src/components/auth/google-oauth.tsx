/** @format */

import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Loader2 } from "lucide-react";
import { id } from "@instantdb/react";
import { Button } from "../ui/button";
import { db } from "@/lib/db/db";
import { autoJoinPendingClasses } from "@/lib/pending-members-utils";
import { checkUserPermissions } from "@/lib/auth-utils";

interface GoogleJwtPayload {
    given_name?: string;
    family_name?: string;
}

const GOOGLE_CLIENT_NAME = import.meta.env.VITE_GOOGLE_CLIENT_NAME || "";

function handleGoogleSuccess(
    credentialResponse: { credential?: string },
    nonce: string,
    termsAccepted: boolean = true
) {
    if (!GOOGLE_CLIENT_NAME) {
        console.error("Google Client Name is not configured");
        alert(
            "Google OAuth is not properly configured. Please check your environment variables."
        );
        return;
    }

    if (!credentialResponse.credential) {
        console.error("No credential received from Google");
        alert("Failed to receive credential from Google. Please try again.");
        return;
    }

    // Store JWT token temporarily
    sessionStorage.setItem("google_id_token", credentialResponse.credential);

    // Decode JWT to extract user's name
    const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
    const firstName = decoded.given_name || "";
    const lastName = decoded.family_name || "";

    db.auth
        .signInWithIdToken({
            clientName: GOOGLE_CLIENT_NAME,
            idToken: credentialResponse.credential,
            nonce,
        })
        .then(async (result) => {
            if (result.user) {
                // Check if created is null and set it if needed
                const { data } = await db.queryOnce({
                    $users: {
                        $: { where: { id: result.user.id } },
                    },
                });
                const userData = data?.$users?.[0];
                const updateData: {
                    firstName: string;
                    lastName: string;
                    plan: string;
                    lastLogon: Date;
                    created?: Date;
                } = {
                    firstName,
                    lastName,
                    plan: "free",
                    lastLogon: new Date(),
                };
                if (userData && !userData.created) {
                    updateData.created = new Date();
                }
                // Update user profile directly using client-side transaction
                db.transact(db.tx.$users[result.user.id].update(updateData));

                // Create terms acceptance record if terms were accepted
                if (termsAccepted) {
                    const acceptanceId = id();
                    db.transact(
                        db.tx.terms_acceptances[acceptanceId]
                            .create({
                                acceptedAt: new Date(),
                            })
                            .link({ user: result.user.id })
                    );
                }

                // Auto-join pending classes
                // Extract email from JWT token
                if (!credentialResponse.credential) {
                    return;
                }
                const decoded = jwtDecode<{ email?: string }>(
                    credentialResponse.credential
                );
                if (decoded.email) {
                    await autoJoinPendingClasses(decoded.email, result.user.id);
                }

                // Check user permissions by attempting to create a test org
                const hasPermissions = await checkUserPermissions(result.user.id);
                if (!hasPermissions) {
                    // User doesn't have permissions - log them out and redirect
                    db.auth.signOut();
                    window.location.href = "/unauthorized-user";
                    return;
                }
            }
        })
        .catch((err) => {
            console.error("Error signing in with Google:", err);
            // Clear token on error
            sessionStorage.removeItem("google_id_token");
            alert(
                "Are you an authorized test user? Failed to sign in with Google: " +
                    (err.body?.message || err.message)
            );
        });
}

function handleGoogleError() {
    alert("Google login failed. Please try again.");
}

export function GoogleOAuthButton({
    termsAccepted = true,
}: {
    termsAccepted?: boolean;
}) {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [nonce] = useState(() => uuidv4());

    const handleGoogleButtonClick = () => {
        if (!termsAccepted) return;
        const googleButton = googleButtonRef.current?.querySelector(
            'div[role="button"], button'
        ) as HTMLElement;
        if (googleButton) {
            googleButton.click();
        }
    };

    return (
        <>
            <div
                ref={googleButtonRef}
                className="hidden"
            >
                <GoogleLogin
                    onSuccess={(credentialResponse) =>
                        handleGoogleSuccess(
                            credentialResponse,
                            nonce,
                            termsAccepted
                        )
                    }
                    onError={handleGoogleError}
                    nonce={nonce}
                    useOneTap={false}
                    auto_select={false}
                />
            </div>

            <div className="flex justify-center">
                <Button
                    onClick={handleGoogleButtonClick}
                    disabled={!termsAccepted}
                    variant="outline"
                    className="p-0 bg-transparent! dark:bg-transparent! border-0 dark:border-0 hover:bg-transparent! dark:hover:bg-transparent! rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Sign in with Google"
                >
                    <img
                        src="/google/light_sign_in.png"
                        alt="Sign in with Google"
                        className="dark:hidden"
                    />
                    <img
                        src="/google/dark_sign_in.png"
                        alt="Sign in with Google"
                        className="hidden dark:block"
                    />
                </Button>
            </div>
        </>
    );
}

export function GoogleOAuthButtonSmall() {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [nonce] = useState(() => uuidv4());

    const handleGoogleButtonClick = () => {
        const googleButton = googleButtonRef.current?.querySelector(
            'div[role="button"], button'
        ) as HTMLElement;
        if (googleButton) {
            googleButton.click();
        }
    };

    return (
        <>
            <div
                ref={googleButtonRef}
                className="hidden"
            >
                <GoogleLogin
                    onSuccess={(credentialResponse) =>
                        handleGoogleSuccess(credentialResponse, nonce)
                    }
                    onError={handleGoogleError}
                    nonce={nonce}
                    useOneTap={false}
                    auto_select={false}
                />
            </div>
            <Button
                onClick={handleGoogleButtonClick}
                variant="outline"
                className="flex-1 p-0 bg-transparent! dark:bg-transparent! border-0 dark:border-0 hover:bg-transparent! dark:hover:bg-transparent! rounded-none cursor-pointer"
                aria-label="Sign in with Google"
            >
                <img
                    src="/google/light_sign_in.png"
                    alt="Sign in with Google"
                    className="dark:hidden"
                />
                <img
                    src="/google/dark_sign_in.png"
                    alt="Sign in with Google"
                    className="hidden dark:block"
                />
            </Button>
        </>
    );
}

interface ContinueWithGoogleButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
}

export function ContinueWithGoogleButton({
    onClick,
    disabled = false,
    isLoading = false,
    className = "",
    variant: _variant = "default",
    size: _size = "default",
}: ContinueWithGoogleButtonProps) {
    return (
        <Button
            onClick={onClick}
            disabled={disabled || isLoading}
            variant="outline"
            className={`w-full p-0 bg-transparent! dark:bg-transparent! border-0 dark:border-0 hover:bg-transparent! dark:hover:bg-transparent! rounded-none cursor-pointer ${className}`}
            aria-label="Continue with Google"
        >
            {isLoading ? (
                <div className="w-full flex items-center justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
            ) : (
                <>
                    <img
                        src="/google/light_sign_in.png"
                        alt="Continue with Google"
                        className="dark:hidden"
                    />
                    <img
                        src="/google/dark_sign_in.png"
                        alt="Continue with Google"
                        className="hidden dark:block"
                    />
                </>
            )}
        </Button>
    );
}

interface GoogleClassroomButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
}

export function GoogleClassroomButton({
    onClick,
    disabled = false,
    isLoading = false,
    className = "",
}: GoogleClassroomButtonProps) {
    return (
        <Button
            onClick={onClick}
            disabled={disabled || isLoading}
            variant="outline"
            size="default"
            className={`w-fit items-center h-[40px] rounded-full justify-start pr-4 py-2 gap-3 ${className}`}
            aria-label="Google Classroom"
            style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 500,
            }}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <img
                    src="/google/yellow_classroom_logo.png"
                    alt="Google Classroom"
                    className="w-[24px] h-[24px]"
                />
            )}
            <span>Google Classroom</span>
        </Button>
    );
}
