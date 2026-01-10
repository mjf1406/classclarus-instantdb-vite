/** @format */

"use client";

import { useState, useRef, type FormEvent } from "react";
import { Mail } from "lucide-react";

import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasteButton } from "@/components/ui/paste-button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import {
    Credenza,
    CredenzaBody,
    CredenzaContent,
    CredenzaDescription,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";

interface MagicCodeAuthProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function MagicCodeAuth({ trigger, onSuccess }: MagicCodeAuthProps) {
    const [open, setOpen] = useState(false);
    const [sentEmail, setSentEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset state when dialog closes
            setSentEmail("");
            setIsLoading(false);
        }
    };

    return (
        <>
            {trigger ? (
                <div onClick={() => setOpen(true)}>{trigger}</div>
            ) : (
                <Button
                    onClick={() => setOpen(true)}
                    variant="secondary"
                    className="w-full items-center gap-2 justify-start"
                    size="lg"
                >
                    <Mail className="h-5 w-5" />
                    Sign in with Email
                </Button>
            )}
            <Credenza
                open={open}
                onOpenChange={handleOpenChange}
            >
                <CredenzaContent className="sm:max-w-md">
                    <CredenzaHeader>
                        <CredenzaTitle>
                            {!sentEmail
                                ? "Sign in with Email"
                                : "Enter your code"}
                        </CredenzaTitle>
                        <CredenzaDescription>
                            {!sentEmail
                                ? "Enter your email, and we'll send you a verification code. We'll create an account for you too if you don't already have one."
                                : `We sent an email to ${sentEmail}. Check your email, and paste the code you see.`}
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody>
                        {!sentEmail ? (
                            <EmailStep
                                onSendEmail={(email) => {
                                    setSentEmail(email);
                                }}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                            />
                        ) : (
                            <CodeStep
                                sentEmail={sentEmail}
                                onBack={() => setSentEmail("")}
                                onSuccess={() => {
                                    setOpen(false);
                                    onSuccess?.();
                                }}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                            />
                        )}
                    </CredenzaBody>
                </CredenzaContent>
            </Credenza>
        </>
    );
}

function EmailStep({
    onSendEmail,
    isLoading,
    setIsLoading,
}: {
    onSendEmail: (email: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const inputEl = inputRef.current;
        if (!inputEl) return;

        const email = inputEl.value.trim();
        if (!email) return;

        setIsLoading(true);
        db.auth
            .sendMagicCode({ email })
            .then(() => {
                onSendEmail(email);
                setIsLoading(false);
            })
            .catch((err) => {
                setIsLoading(false);
                alert("Uh oh: " + (err.body?.message || err.message));
            });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <Input
                ref={inputRef}
                type="email"
                placeholder="Enter your email"
                required
                autoFocus
                disabled={isLoading}
            />
            <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
            >
                {isLoading ? "Sending..." : "Send Code"}
            </Button>
        </form>
    );
}

function CodeStep({
    sentEmail,
    onBack,
    onSuccess,
    isLoading,
    setIsLoading,
}: {
    sentEmail: string;
    onBack: () => void;
    onSuccess: () => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}) {
    const [code, setCode] = useState("");

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedCode = code.trim();
        if (!trimmedCode) return;

        setIsLoading(true);
        db.auth
            .signInWithMagicCode({ email: sentEmail, code: trimmedCode })
            .then(async (result) => {
                if (result.user) {
                    const { data } = await db.queryOnce({
                        $users: {
                            $: { where: { id: result.user.id } },
                        },
                    });
                    const userData = data?.$users?.[0];
                    const updateData: {
                        lastLogon: Date;
                        created?: Date;
                    } = {
                        lastLogon: new Date(),
                    };
                    if (userData && !userData.created) {
                        updateData.created = new Date();
                    }
                    db.transact(
                        db.tx.$users[result.user.id].update(updateData)
                    );
                }
                setIsLoading(false);
                onSuccess();
            })
            .catch((err) => {
                setIsLoading(false);
                setCode("");
                alert("Uh oh: " + (err.body?.message || err.message));
            });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <div className="flex justify-center">
                <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={setCode}
                    disabled={isLoading}
                    autoFocus
                    inputMode="numeric"
                    pattern="[0-9]*"
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
            </div>
            <PasteButton
                onPasteSuccess={(text) => {
                    // Extract only numeric characters and limit to 6 digits
                    const numericCode = text.replace(/\D/g, "").slice(0, 6);
                    if (numericCode.length === 6) {
                        setCode(numericCode);
                    }
                }}
                disabled={isLoading}
                size="icon"
                variant="ghost"
            />
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1"
                    disabled={isLoading}
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading || code.length < 6}
                >
                    {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
            </div>
        </form>
    );
}
