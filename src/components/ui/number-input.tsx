import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

interface NumberInputProps
    extends Omit<React.ComponentProps<"input">, "type" | "step" | "onChange"> {
    value: string | number;
    onChange: (value: string) => void;
    step?: number;
    min?: number;
    max?: number;
    disabled?: boolean;
}

export function NumberInput({
    value,
    onChange,
    step = 1,
    min,
    max,
    disabled,
    className,
    ...props
}: NumberInputProps) {
    const numericValue = Number(value);
    const isValidNumber = !Number.isNaN(numericValue);

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;

        const multiplier = e.ctrlKey && e.shiftKey ? 25 : e.ctrlKey ? 5 : e.shiftKey ? 10 : 1;
        const increment = step * multiplier;
        const newValue = isValidNumber ? numericValue + increment : step;
        const finalValue = max !== undefined ? Math.min(newValue, max) : newValue;
        onChange(String(finalValue));
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;

        const multiplier = e.ctrlKey && e.shiftKey ? 25 : e.ctrlKey ? 5 : e.shiftKey ? 10 : 1;
        const decrement = step * multiplier;
        const newValue = isValidNumber ? numericValue - decrement : step;
        const finalValue = min !== undefined ? Math.max(newValue, min) : newValue;
        onChange(String(finalValue));
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleDecrement}
                disabled={disabled || (min !== undefined && isValidNumber && numericValue <= min)}
                className="shrink-0"
            >
                <Minus className="size-4" />
                <span className="sr-only">Decrease</span>
            </Button>
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                step={step}
                min={min}
                max={max}
                disabled={disabled}
                className="text-center"
                {...props}
            />
            <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleIncrement}
                disabled={disabled || (max !== undefined && isValidNumber && numericValue >= max)}
                className="shrink-0"
            >
                <Plus className="size-4" />
                <span className="sr-only">Increase</span>
            </Button>
        </div>
    );
}
