/** @format */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyCodeButtonProps {
    code: string;
    onCopySuccess?: () => void;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

export function CopyCodeButton({
    code,
    onCopySuccess,
    className,
    variant = "outline",
    size = "default",
}: CopyCodeButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            onCopySuccess?.();
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy code:", error);
        }
    };

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            onClick={handleCopy}
            className={cn("gap-2", className)}
        >
            {copied ? (
                <>
                    <Check className="size-4" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className="size-4" />
                    Copy Code
                </>
            )}
        </Button>
    );
}
