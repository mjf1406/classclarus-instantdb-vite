/** @format */

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Mail } from "lucide-react";

import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { autoJoinPendingClasses } from "@/lib/pending-members-utils";
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
import { cn } from "@/lib/utils";

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
                    onTouchStart={() => setOpen(true)}
                    variant="outline"
                    className="w-full items-center gap-2 justify-start bg-white text-black hover:bg-white/80 dark:bg-black dark:text-white dark:hover:bg-black/80"
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
                <CredenzaContent
                    className={cn(
                        "sm:max-w-md",
                        !sentEmail ? "pb-4 md:pb-4" : "pb-4 md:pb-4"
                    )}
                >
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
                    <CredenzaBody className={!sentEmail ? "pb-0" : ""}>
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

    useEffect(() => {
        // Focus the input when the dialog opens
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

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
    const formRef = useRef<HTMLFormElement>(null);

    // Auto-submit when code is complete
    useEffect(() => {
        if (code.length === 6 && formRef.current && !isLoading) {
            formRef.current.requestSubmit();
        }
    }, [code, isLoading]);

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

                    // Auto-join pending classes
                    if (sentEmail) {
                        await autoJoinPendingClasses(sentEmail, result.user.id);
                    }
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
            ref={formRef}
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
            <div className="flex flex-col gap-2 my-auto mx-auto">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={onBack}
                    disabled={isLoading}
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading || code.length < 6}
                >
                    {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
            </div>
        </form>
    );
}
