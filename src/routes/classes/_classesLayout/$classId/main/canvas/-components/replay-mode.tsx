/** @format */

import { useState, useEffect } from "react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type PixelHistory = InstaQLEntity<
    AppSchema,
    "canvas_pixel_history",
    { canvas: {}; placedBy: {} }
>;

type PixelHistoryQueryResult = {
    canvas_pixel_history: PixelHistory[];
};

interface ReplayModeProps {
    canvasId: string;
    width: number;
    height: number;
}

export function ReplayMode({ canvasId, width, height }: ReplayModeProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Query pixel history
    const { data: historyData } = db.useQuery(
        canvasId
            ? {
                  canvas_pixel_history: {
                      $: {
                          where: { "canvas.id": canvasId },
                          order: { sequenceNumber: "asc" },
                      },
                      canvas: {},
                      placedBy: {},
                  },
              }
            : null
    );

    const typedHistoryData = (historyData as PixelHistoryQueryResult | undefined) ?? null;
    const history = typedHistoryData?.canvas_pixel_history || [];

    // Playback effect
    useEffect(() => {
        if (!isPlaying || currentIndex >= history.length) {
            setIsPlaying(false);
            return;
        }

        const delay = 1000 / playbackSpeed; // milliseconds between frames
        const timer = setTimeout(() => {
            setCurrentIndex((prev) => Math.min(prev + 1, history.length));
        }, delay);

        return () => clearTimeout(timer);
    }, [isPlaying, currentIndex, history.length, playbackSpeed]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleStepBack = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setIsPlaying(false);
    };

    const handleStepForward = () => {
        setCurrentIndex((prev) => Math.min(history.length, prev + 1));
        setIsPlaying(false);
    };

    const handleReset = () => {
        setCurrentIndex(0);
        setIsPlaying(false);
    };

    // Build canvas state up to current index
    const currentState = new Map<string, string>();
    for (let i = 0; i < currentIndex; i++) {
        const pixel = history[i];
        if (pixel) {
            const key = `${pixel.x},${pixel.y}`;
            currentState.set(key, pixel.color);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleStepBack} disabled={currentIndex === 0}>
                        <SkipBack className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePlayPause}>
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleStepForward} disabled={currentIndex >= history.length}>
                        <SkipForward className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="size-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm">
                        {currentIndex} / {history.length} pixels
                    </div>
                    <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="px-2 py-1 border rounded text-sm"
                    >
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={5}>5x</option>
                        <option value={10}>10x</option>
                    </select>
                </div>
            </div>
            <div className="border rounded-lg p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground mb-2">
                    Canvas state at position {currentIndex} in history
                </div>
                {/* Render canvas preview */}
                <div className="grid gap-0 border" style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}>
                    {Array.from({ length: width * height }, (_, i) => {
                        const x = i % width;
                        const y = Math.floor(i / width);
                        const key = `${x},${y}`;
                        const color = currentState.get(key) || "#FFFFFF";
                        return (
                            <div
                                key={i}
                                className="aspect-square border border-border"
                                style={{ backgroundColor: color, width: "8px", height: "8px" }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
