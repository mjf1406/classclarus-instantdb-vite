/** @format */

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CooldownIndicatorProps {
    canvasId: string;
    cooldownSeconds: number;
}

export function CooldownIndicator({ canvasId, cooldownSeconds }: CooldownIndicatorProps) {
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        if (cooldownSeconds === 0) {
            setRemainingSeconds(0);
            return;
        }

        // Check cooldown (per-user, stored in localStorage)
        const checkCooldown = () => {
            const key = `canvas_cooldown_${canvasId}`;
            const cooldownUntil = localStorage.getItem(key);
            if (!cooldownUntil) {
                setRemainingSeconds(0);
                return;
            }

            const now = Date.now();
            const until = parseInt(cooldownUntil, 10);
            const remaining = Math.max(0, Math.ceil((until - now) / 1000));
            setRemainingSeconds(remaining);
        };

        checkCooldown();
        const interval = setInterval(checkCooldown, 100);
        return () => clearInterval(interval);
    }, [canvasId, cooldownSeconds]);

    if (cooldownSeconds === 0) {
        return null;
    }

    const progress = remainingSeconds > 0 ? (cooldownSeconds - remainingSeconds) / cooldownSeconds : 1;
    const circumference = 2 * Math.PI * 18; // radius = 18
    const offset = circumference * (1 - progress);

    return (
        <div className="flex items-center gap-2 p-2 bg-card border rounded-lg">
            <div className="relative size-10">
                <svg className="size-10 -rotate-90" viewBox="0 0 40 40">
                    <circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-muted"
                    />
                    <circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="text-primary transition-all duration-100"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="size-4 text-muted-foreground" />
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Cooldown</span>
                <span className="text-sm font-semibold">
                    {remainingSeconds > 0 ? `${remainingSeconds}s` : "Ready"}
                </span>
            </div>
        </div>
    );
}
