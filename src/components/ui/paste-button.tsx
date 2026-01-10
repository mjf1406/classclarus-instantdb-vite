/** @format */

import * as React from "react";
import { ClipboardPaste } from "lucide-react";
import { Button, buttonVariants } from "./button";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface PasteButtonProps
    extends
        Omit<React.ComponentProps<"button">, "onClick">,
        VariantProps<typeof buttonVariants> {
    /**
     * Render as a child component (for composition with Radix UI)
     */
    asChild?: boolean;
    /**
     * Ref to the target element where the pasted content should be inserted
     */
    targetRef?: React.RefObject<
        HTMLInputElement | HTMLTextAreaElement | HTMLElement
    >;
    /**
     * CSS selector for the target element (alternative to targetRef)
     */
    targetSelector?: string;
    /**
     * Callback fired when paste is successful
     */
    onPasteSuccess?: (text: string) => void;
    /**
     * Callback fired when paste fails
     */
    onPasteError?: (error: Error) => void;
    /**
     * Whether to focus the target element after pasting
     */
    focusTarget?: boolean;
}

const PasteButton = React.forwardRef<HTMLButtonElement, PasteButtonProps>(
    (
        {
            targetRef,
            targetSelector,
            onPasteSuccess,
            onPasteError,
            focusTarget = true,
            className,
            children,
            size,
            variant = "outline",
            asChild = false,
            ...props
        },
        ref
    ) => {
        const handlePaste = async () => {
            try {
                // Read from clipboard
                const text = await navigator.clipboard.readText();

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
                        "Target element not found. Provide either targetRef or targetSelector."
                    );
                }

                // Handle different element types
                if (
                    targetElement instanceof HTMLInputElement ||
                    targetElement instanceof HTMLTextAreaElement
                ) {
                    // For input and textarea elements
                    const input = targetElement as
                        | HTMLInputElement
                        | HTMLTextAreaElement;
                    const start = input.selectionStart || 0;
                    const end = input.selectionEnd || 0;
                    const currentValue = input.value;

                    // Insert text at cursor position
                    const newValue =
                        currentValue.slice(0, start) +
                        text +
                        currentValue.slice(end);
                    input.value = newValue;

                    // Set cursor position after pasted text
                    input.setSelectionRange(
                        start + text.length,
                        start + text.length
                    );

                    // Trigger input event for React controlled components
                    const event = new Event("input", { bubbles: true });
                    input.dispatchEvent(event);
                } else if (targetElement.isContentEditable) {
                    // For contenteditable elements
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        const textNode = document.createTextNode(text);
                        range.insertNode(textNode);
                        range.setStartAfter(textNode);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        targetElement.textContent =
                            (targetElement.textContent || "") + text;
                    }
                } else {
                    // Fallback: try to set value or textContent
                    if ("value" in targetElement) {
                        (targetElement as any).value = text;
                        const event = new Event("input", { bubbles: true });
                        targetElement.dispatchEvent(event);
                    } else {
                        targetElement.textContent = text;
                    }
                }

                // Focus target element if requested
                if (focusTarget) {
                    targetElement.focus();
                }

                // Call success callback
                onPasteSuccess?.(text);
            } catch (error) {
                const pasteError =
                    error instanceof Error
                        ? error
                        : new Error("Failed to paste from clipboard");
                onPasteError?.(pasteError);
                console.error("Paste failed:", pasteError);
            }
        };

        return (
            <Button
                ref={ref}
                type="button"
                size={size}
                variant={variant}
                asChild={asChild}
                onClick={handlePaste}
                className={cn("gap-2", className)}
                {...props}
            >
                <ClipboardPaste className="size-4" />
                {children || "Paste"}
            </Button>
        );
    }
);

PasteButton.displayName = "PasteButton";

export { PasteButton, type PasteButtonProps };
