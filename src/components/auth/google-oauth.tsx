/** @format */

"use client";

import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Button } from "../ui/button";
import { db } from "@/lib/db/db";

interface GoogleJwtPayload {
    given_name?: string;
    family_name?: string;
}

const GOOGLE_CLIENT_NAME = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_NAME || "";

function handleGoogleSuccess(
    credentialResponse: { credential?: string },
    nonce: string
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
            }
        })
        .catch((err) => {
            console.error("Error signing in with Google:", err);
            // Clear token on error
            sessionStorage.removeItem("google_id_token");
            alert(
                "Failed to sign in with Google: " +
                    (err.body?.message || err.message)
            );
        });
}

function handleGoogleError() {
    alert("Google login failed. Please try again.");
}

export function GoogleOAuthButton() {
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
                variant="secondary"
                className="w-full items-center gap-2 justify-start"
                size="lg"
                aria-label="Sign in with Google"
            >
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Sign in with Google
            </Button>
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
                variant="secondary"
                size="sm"
                className="flex-1 h-8 text-xs"
                aria-label="Sign in with Google"
            >
                <svg
                    className="h-3.5 w-3.5 mr-1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Google
            </Button>
        </>
    );
}
