/** @format */

import { useEffect } from "react";
import { cn } from "@/lib/utils";

const PALETTE = [
    "#FFFFFF",
    "#E4E4E4",
    "#888888",
    "#222222",
    "#FFA7D1",
    "#E50000",
    "#E59500",
    "#A06A42",
    "#E5D900",
    "#94E044",
    "#02BE01",
    "#00D3DD",
    "#0083C7",
    "#0000EA",
    "#CF6EE4",
    "#820080",
    "#FFD635",
    "#FF99AA",
    "#00CCC0",
    "#009EAA",
    "#493AC1",
    "#6A5CFF",
    "#94B3FF",
    "#000000",
    "#FF4500",
    "#BE0039",
    "#B44AC0",
    "#811E9F",
    "#6D001A",
    "#515252",
    "#D4D7D9",
    "#898D90",
];

interface ColorPaletteProps {
    selectedColor: string;
    onColorSelect: (color: string) => void;
}

export function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
    // Keyboard shortcuts (1-9, 0 for first 10 colors)
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            const key = e.key;
            if (key >= "1" && key <= "9") {
                const index = parseInt(key) - 1;
                if (PALETTE[index]) {
                    onColorSelect(PALETTE[index]);
                }
            } else if (key === "0") {
                onColorSelect(PALETTE[9]);
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [onColorSelect]);

    return (
        <div className="flex items-center gap-2 p-2 bg-card border rounded-lg flex-wrap">
            <span className="text-sm font-medium text-muted-foreground shrink-0">Colors:</span>
            <div className="flex gap-1 flex-wrap">
                {PALETTE.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onColorSelect(color)}
                        className={cn(
                            "size-8 rounded border-2 transition-all hover:scale-110 shrink-0",
                            selectedColor === color
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Select color ${color}`}
                    />
                ))}
            </div>
        </div>
    );
}
