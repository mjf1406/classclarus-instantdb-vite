/** @format */

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyJoinUrlButtonProps {
    code: string;
    onCopySuccess?: () => void;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

export function CopyJoinUrlButton({
    code,
    onCopySuccess,
    className,
    variant = "outline",
    size = "default",
}: CopyJoinUrlButtonProps) {
    const [copied, setCopied] = useState(false);

    const joinUrl = `${window.location.origin}/join/class?code=${code}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            onCopySuccess?.();
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy URL:", error);
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
                    <LinkIcon className="size-4" />
                    Copy URL
                </>
            )}
        </Button>
    );
}
