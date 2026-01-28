/** @format */

import { ZoomIn, ZoomOut, RotateCcw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ClassRoleInfo } from "@/hooks/use-class-role";

interface CanvasToolbarProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
    isReplayMode: boolean;
    onReplayModeChange: (isReplay: boolean) => void;
    canEdit?: boolean;
    roleInfo: ClassRoleInfo;
}

export function CanvasToolbar({
    zoom,
    onZoomChange,
    isReplayMode,
    onReplayModeChange,
    roleInfo,
}: CanvasToolbarProps) {
    const canAccessReplay = roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    const handleZoomIn = () => {
        onZoomChange(Math.min(8, zoom * 1.5));
    };

    const handleZoomOut = () => {
        onZoomChange(Math.max(0.5, zoom / 1.5));
    };

    const handleResetZoom = () => {
        onZoomChange(1);
    };

    return (
        <div className="flex items-center justify-between p-2 bg-card border rounded-lg">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Zoom:</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                >
                    <ZoomOut className="size-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 8}
                >
                    <ZoomIn className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                    <RotateCcw className="size-4" />
                </Button>
            </div>
            {canAccessReplay && (
                <>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                        variant={isReplayMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => onReplayModeChange(!isReplayMode)}
                    >
                        <History className="size-4 mr-2" />
                        {isReplayMode ? "Exit Replay" : "Replay Mode"}
                    </Button>
                </>
            )}
        </div>
    );
}
