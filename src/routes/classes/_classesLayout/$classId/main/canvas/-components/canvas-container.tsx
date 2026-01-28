/** @format */

import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { PixelCanvas } from "./pixel-canvas";
import { ColorPalette } from "./color-palette";
import { CursorOverlay } from "./cursor-overlay";
import { CanvasToolbar } from "./canvas-toolbar";
import { ReplayMode } from "./replay-mode";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { ClassRoleInfo } from "@/hooks/use-class-role";

type CanvasConfig = InstaQLEntity<AppSchema, "canvas_configs", { class: {} }>;
type Canvas = InstaQLEntity<AppSchema, "canvases", { class: {} }>;

type CanvasConfigQueryResult = {
    canvas_configs: CanvasConfig[];
};

type CanvasQueryResult = {
    canvases: Canvas[];
};

interface CanvasContainerProps {
    classId: string;
    roleInfo: ClassRoleInfo;
}

export function CanvasContainer({ classId, roleInfo }: CanvasContainerProps) {
    const [selectedColor, setSelectedColor] = useState("#FFFFFF");
    const [zoom, setZoom] = useState(1);
    const [isReplayMode, setIsReplayMode] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // Query canvas config
    const { data: configData } = db.useQuery(
        classId
            ? {
                  canvas_configs: {
                      $: {
                          where: { "class.id": classId },
                      },
                      class: {},
                  },
              }
            : null
    );

    // Query active canvas
    const { data: canvasData } = db.useQuery(
        classId
            ? {
                  canvases: {
                      $: {
                          where: {
                              and: [{ "class.id": classId }, { isActive: true }],
                          },
                      },
                      class: {},
                  },
              }
            : null
    );

    const typedConfigData = (configData as CanvasConfigQueryResult | undefined) ?? null;
    const config = typedConfigData?.canvas_configs?.[0];
    const typedCanvasData = (canvasData as CanvasQueryResult | undefined) ?? null;
    const activeCanvas = typedCanvasData?.canvases?.[0];

    // Check if user can view/edit
    // All members can view if Place is enabled
    const canView = config?.isEnabled ?? false;

    // All members except guardians can edit if Place is enabled
    const canEdit = (config?.isEnabled ?? false) && !roleInfo.isGuardian;

    if (!config || !config.isEnabled) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)] border rounded-lg">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground">Place is not enabled for this class</p>
                    <p className="text-sm text-muted-foreground">
                        Contact your teacher to enable Place
                    </p>
                </div>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)] border rounded-lg">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground">You don't have permission to view Place</p>
                </div>
            </div>
        );
    }

    const canCreateCanvas = roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher;

    const handleCreateCanvas = async () => {
        // First, deactivate all existing canvases
        const allCanvases = typedCanvasData?.canvases || [];
        const deactivateTxs = allCanvases
            .filter((c) => c.isActive)
            .map((c) => db.tx.canvases[c.id].update({ isActive: false }));

        // Then create new active canvas
        const canvasId = id();
        const now = new Date();
        const createTx = db.tx.canvases[canvasId]
            .create({
                name: `Canvas ${allCanvases.length + 1}`,
                isActive: true,
                created: now,
            })
            .link({ class: classId });

        db.transact([...deactivateTxs, createTx]);
    };

    if (!activeCanvas) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)] border rounded-lg">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No active canvas found</p>
                    {canCreateCanvas ? (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Create a new canvas to get started
                            </p>
                            <Button onClick={handleCreateCanvas}>
                                <Plus className="size-4 mr-2" />
                                Create Canvas
                            </Button>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            A teacher needs to create a canvas first
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (isReplayMode && (roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher)) {
        return (
            <div className="space-y-4">
                <CanvasToolbar
                    zoom={zoom}
                    onZoomChange={setZoom}
                    isReplayMode={isReplayMode}
                    onReplayModeChange={setIsReplayMode}
                    canEdit={canEdit}
                    roleInfo={roleInfo}
                />
                <ReplayMode canvasId={activeCanvas.id} width={config.width} height={config.height} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <CanvasToolbar
                zoom={zoom}
                onZoomChange={setZoom}
                isReplayMode={isReplayMode}
                onReplayModeChange={setIsReplayMode}
                canEdit={canEdit}
                roleInfo={roleInfo}
            />
            <div className="relative border rounded-lg overflow-hidden bg-muted/50">
                <PixelCanvas
                    canvasId={activeCanvas.id}
                    width={config.width}
                    height={config.height}
                    zoom={zoom}
                    selectedColor={selectedColor}
                    canEdit={canEdit}
                    cooldownSeconds={config.cooldownSeconds}
                    pan={pan}
                    onPanChange={setPan}
                />
                <CursorOverlay
                    canvasId={activeCanvas.id}
                    zoom={zoom}
                    width={config.width}
                    height={config.height}
                    pan={pan}
                />
            </div>
            {canEdit && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <ColorPalette selectedColor={selectedColor} onColorSelect={setSelectedColor} />
                </div>
            )}
        </div>
    );
}
