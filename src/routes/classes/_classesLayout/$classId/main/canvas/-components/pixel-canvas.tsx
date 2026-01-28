/** @format */

import { useEffect, useRef, useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { useAuthContext } from "@/components/auth/auth-provider";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let lastCall = 0;
    return ((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    }) as T;
}

type CanvasPixel = InstaQLEntity<AppSchema, "canvas_pixels", { canvas: {}; updatedBy: {} }>;

type CanvasPixelsQueryResult = {
    canvas_pixels: CanvasPixel[];
};

interface PixelCanvasProps {
    canvasId: string;
    width: number;
    height: number;
    zoom: number;
    selectedColor: string;
    canEdit: boolean;
    cooldownSeconds: number;
    pan: { x: number; y: number };
    onPanChange: (pan: { x: number; y: number }) => void;
}

export function PixelCanvas({
    canvasId,
    width,
    height,
    zoom,
    selectedColor,
    canEdit,
    cooldownSeconds,
    pan,
    onPanChange,
}: PixelCanvasProps) {
    const { user } = useAuthContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [remainingCooldown, setRemainingCooldown] = useState(0);
    const pixelSize = 10; // Size of each pixel on screen

    // Set up cursor presence
    const room = db.room("classCanvas", canvasId);
    const { user: myPresence, publishPresence } = db.rooms.usePresence(room, {
        initialPresence: {
            userName: user?.firstName || user?.email || "Anonymous",
            userColor: "#0083C7",
            cursorX: 0,
            cursorY: 0,
            selectedColor: selectedColor,
        },
    });

    // Throttled cursor update function
    const throttledUpdateCursor = useRef(
        throttle((pixelX: number, pixelY: number) => {
            if (myPresence) {
                publishPresence({
                    ...myPresence,
                    cursorX: pixelX,
                    cursorY: pixelY,
                    selectedColor: selectedColor,
                });
            }
        }, 100)
    ).current;

    // Check cooldown status
    useEffect(() => {
        if (cooldownSeconds === 0 || !canEdit) {
            setRemainingCooldown(0);
            return;
        }

        const checkCooldown = () => {
            const key = `canvas_cooldown_${canvasId}`;
            const cooldownUntil = localStorage.getItem(key);
            if (!cooldownUntil) {
                setRemainingCooldown(0);
                return;
            }

            const now = Date.now();
            const until = parseInt(cooldownUntil, 10);
            const remaining = Math.max(0, Math.ceil((until - now) / 1000));
            setRemainingCooldown(remaining);
        };

        checkCooldown();
        const interval = setInterval(checkCooldown, 100);
        return () => clearInterval(interval);
    }, [canvasId, cooldownSeconds, canEdit]);

    // Update presence when selectedColor changes
    useEffect(() => {
        if (myPresence) {
            publishPresence({
                ...myPresence,
                selectedColor: selectedColor,
            });
        }
    }, [selectedColor, myPresence, publishPresence]);

    // Query pixels
    const { data: pixelsData } = db.useQuery(
        canvasId
            ? {
                  canvas_pixels: {
                      $: {
                          where: { "canvas.id": canvasId },
                      },
                      canvas: {},
                      updatedBy: {},
                  },
              }
            : null
    );

    const typedPixelsData = (pixelsData as CanvasPixelsQueryResult | undefined) ?? null;
    const pixels = typedPixelsData?.canvas_pixels || [];

    // Create pixel map for fast lookup
    const pixelMap = new Map<string, string>();
    pixels.forEach((pixel) => {
        const key = `${pixel.x},${pixel.y}`;
        pixelMap.set(key, pixel.color);
    });

    // Render canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const scaledWidth = width * pixelSize;
        const scaledHeight = height * pixelSize;
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        // Clear canvas
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, scaledWidth, scaledHeight);

        // Draw grid
        ctx.strokeStyle = "#E5E5E5";
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * pixelSize, 0);
            ctx.lineTo(x * pixelSize, scaledHeight);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * pixelSize);
            ctx.lineTo(scaledWidth, y * pixelSize);
            ctx.stroke();
        }

        // Draw pixels
        pixelMap.forEach((color, key) => {
            const [x, y] = key.split(",").map(Number);
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        });
    }, [pixels, width, height, pixelSize, pixelMap]);

    // Handle mouse events for panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            // Left click
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                // Pan mode
                setIsDragging(true);
                setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            } else if (canEdit) {
                // Place pixel
                handlePlacePixel(e);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            onPanChange({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }

        // Update cursor presence with pixel coordinates
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const scale = zoom;
            // Calculate pixel coordinates (getBoundingClientRect already accounts for CSS transforms)
            const pixelX = Math.floor((e.clientX - rect.left) / (pixelSize * scale));
            const pixelY = Math.floor((e.clientY - rect.top) / (pixelSize * scale));
            
            // Clamp to valid canvas bounds
            const clampedX = Math.max(0, Math.min(width - 1, pixelX));
            const clampedY = Math.max(0, Math.min(height - 1, pixelY));
            
            throttledUpdateCursor(clampedX, clampedY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handlePlacePixel = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas || !canEdit) return;

        // Check cooldown (per-user, stored in localStorage)
        if (cooldownSeconds > 0) {
            const key = `canvas_cooldown_${canvasId}`;
            const cooldownUntil = localStorage.getItem(key);
            if (cooldownUntil) {
                const now = Date.now();
                const until = parseInt(cooldownUntil, 10);
                if (now < until) {
                    return; // Still on cooldown (per-user basis)
                }
            }
        }

        const rect = canvas.getBoundingClientRect();
        const scale = zoom;
        // getBoundingClientRect already accounts for CSS transforms (pan + zoom)
        const x = Math.floor((e.clientX - rect.left) / (pixelSize * scale));
        const y = Math.floor((e.clientY - rect.top) / (pixelSize * scale));

        if (x < 0 || x >= width || y < 0 || y >= height) return;

        // Set cooldown (per-user, stored in localStorage)
        if (cooldownSeconds > 0) {
            const key = `canvas_cooldown_${canvasId}`;
            const cooldownUntil = Date.now() + cooldownSeconds * 1000;
            localStorage.setItem(key, cooldownUntil.toString());
        }

        // Find existing pixel or create new one
        const existingPixel = pixels.find((p) => p.x === x && p.y === y);
        const now = new Date();

        if (!user?.id) return;

        if (existingPixel) {
            // Update existing pixel
            const historyId = id();
            db.transact([
                db.tx.canvas_pixels[existingPixel.id]
                    .update({
                        color: selectedColor,
                        updatedAt: now,
                    })
                    .link({ updatedBy: user.id }),
                db.tx.canvas_pixel_history[historyId]
                    .create({
                        x,
                        y,
                        color: selectedColor,
                        placedAt: now,
                        sequenceNumber: Date.now(), // Simple sequence number
                    })
                    .link({ canvas: canvasId })
                    .link({ placedBy: user.id }),
            ]);
        } else {
            // Create new pixel
            const pixelId = id();
            const historyId = id();
            db.transact([
                db.tx.canvas_pixels[pixelId]
                    .create({
                        x,
                        y,
                        color: selectedColor,
                        updatedAt: now,
                    })
                    .link({ canvas: canvasId })
                    .link({ updatedBy: user.id }),
                db.tx.canvas_pixel_history[historyId]
                    .create({
                        x,
                        y,
                        color: selectedColor,
                        placedAt: now,
                        sequenceNumber: Date.now(),
                    })
                    .link({ canvas: canvasId })
                    .link({ placedBy: user.id }),
            ]);
        }
    };

    const isOnCooldown = remainingCooldown > 0;

    // Calculate progress for circular indicator
    const progress = cooldownSeconds > 0 ? (cooldownSeconds - remainingCooldown) / cooldownSeconds : 1;
    const circumference = 2 * Math.PI * 36; // radius = 36 (larger for dialog)
    const offset = circumference * (1 - progress);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[600px] overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className="absolute"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "top left",
                }}
            >
                <canvas
                    ref={canvasRef}
                    className={isOnCooldown ? "cursor-not-allowed" : "cursor-crosshair"}
                    style={{ imageRendering: "pixelated" }}
                />
            </div>
            {isOnCooldown && (
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-6 flex flex-col items-center gap-3 shadow-lg">
                        <div className="relative size-20">
                            <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="text-muted"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    className="text-primary transition-all duration-100"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary">{remainingCooldown}s</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold">On Cooldown</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Wait before placing another pixel
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
