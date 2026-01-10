/** @format */

import * as React from "react";
import { Copy } from "lucide-react";
import { Button, buttonVariants } from "./button";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface CopyButtonProps
    extends
        Omit<React.ComponentProps<"button">, "onClick">,
        VariantProps<typeof buttonVariants> {
    /**
     * Render as a child component (for composition with Radix UI)
     */
    asChild?: boolean;
    /**
     * Ref to the target element where the content should be copied from
     */
    targetRef?: React.RefObject<
        HTMLInputElement | HTMLTextAreaElement | HTMLElement
    >;
    /**
     * CSS selector for the target element (alternative to targetRef)
     */
    targetSelector?: string;
    /**
     * Callback fired when copy is successful
     */
    onCopySuccess?: (text: string) => void;
    /**
     * Callback fired when copy fails
     */
    onCopyError?: (error: Error) => void;
    /**
     * Custom text to copy (overrides target element content)
     */
    textToCopy?: string;
}

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
    (
        {
            targetRef,
            targetSelector,
            onCopySuccess,
            onCopyError,
            textToCopy,
            className,
            children,
            size,
            variant = "outline",
            asChild = false,
            ...props
        },
        ref
    ) => {
        const handleCopy = async () => {
            try {
                let text: string;

                // If custom text provided, use it
                if (textToCopy !== undefined) {
                    text = textToCopy;
                } else {
                    // Find target element
                    let targetElement:
                        | HTMLInputElement
                        | HTMLTextAreaElement
                        | HTMLElement
                        | null = null;

                    if (targetRef?.current) {
                        targetElement = targetRef.current;
                    } else if (targetSelector) {
                        targetElement = document.querySelector(
                            targetSelector
                        ) as HTMLElement;
                    }

                    if (!targetElement) {
                        throw new Error(
                            "Target element not found. Provide either targetRef, targetSelector, or textToCopy."
                        );
                    }

                    // Extract text based on element type
                    if (
                        targetElement instanceof HTMLInputElement ||
                        targetElement instanceof HTMLTextAreaElement
                    ) {
                        // For input and textarea elements, get the value
                        text = targetElement.value;
                    } else if (targetElement.isContentEditable) {
                        // For contenteditable elements, get text content
                        text = targetElement.textContent || "";
                    } else {
                        // Fallback: try to get value or textContent
                        if ("value" in targetElement) {
                            text = (targetElement as any).value || "";
                        } else {
                            text = targetElement.textContent || "";
                        }
                    }
                }

                // Write to clipboard
                await navigator.clipboard.writeText(text);

                // Call success callback
                onCopySuccess?.(text);
            } catch (error) {
                const copyError =
                    error instanceof Error
                        ? error
                        : new Error("Failed to copy to clipboard");
                onCopyError?.(copyError);
                console.error("Copy failed:", copyError);
            }
        };

        return (
            <Button
                ref={ref}
                type="button"
                size={size}
                variant={variant}
                asChild={asChild}
                onClick={handleCopy}
                className={cn("gap-2", className)}
                {...props}
            >
                <Copy className="size-4" />
                {children || "Copy"}
            </Button>
        );
    }
);

CopyButton.displayName = "CopyButton";

export { CopyButton, type CopyButtonProps };
