/** @format */

import { useState } from "react";
import { LogoBig } from "@/components/brand/logo";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
// import { Separator } from "@/components/ui/separator";
import { GoogleOAuthButton } from "@/components/auth/google-oauth";
import { MagicCodeAuth } from "@/components/auth/magic-code-auth";
// import TryAsGuestButton from "@/components/auth/guest-auth";
// import GuestDescription from "@/components/guest/guest-description";
// import GuestLimitations from "@/components/guest/guest-limitations-section";

export function LoginCard() {
    const [termsAccepted, setTermsAccepted] = useState(false);

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-3">
                <div className="flex justify-center">
                    <LogoBig />
                </div>
                <div>
                    <CardTitle className="text-2xl">
                        Welcome to ClassClarus
                    </CardTitle>
                    <CardDescription className="mt-2">
                        Sign in to continue.{" "}
                        <a
                            href="https://www.classclarus.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4"
                        >
                            Learn more about what we do
                        </a>
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 mt-8">
                <div className="flex items-start space-x-2 pb-2">
                    <Checkbox
                        id="terms-acceptance"
                        checked={termsAccepted}
                        onCheckedChange={(checked) =>
                            setTermsAccepted(checked === true)
                        }
                        className="mt-0.5 bg-background"
                    />
                    <label
                        htmlFor="terms-acceptance"
                        className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                    >
                        I agree to the{" "}
                        <a
                            href="https://www.classclarus.com/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            privacy policy
                        </a>
                        ,{" "}
                        <a
                            href="https://www.classclarus.com/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            terms and conditions
                        </a>
                        , and{" "}
                        <a
                            href="https://www.classclarus.com/cookie-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            cookie policy
                        </a>
                        .
                    </label>
                </div>
                <GoogleOAuthButton termsAccepted={termsAccepted} />
                <MagicCodeAuth termsAccepted={termsAccepted} />
                {/* <div className="flex justify-center">
                    <GoogleClassroomButton onClick={() => {}} />
                </div> */}
                {/* <div className="flex items-center gap-4 py-2">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                </div> */}
                {/* <TryAsGuestButton /> */}
                {/* <GuestDescription /> */}
                {/* <GuestLimitations /> */}
                <div className="pt-4 mt-4 border-t">
                    <p className="text-xs text-center text-muted-foreground">
                        This is the ClassClarus app.{" "}
                        <a
                            href="https://www.classclarus.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4"
                        >
                            Learn more about what we do
                        </a>
                        .
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
