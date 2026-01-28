/** @format */

import { db } from "@/lib/db/db";

interface CursorOverlayProps {
    canvasId: string;
    zoom: number;
    width?: number;
    height?: number;
    pan: { x: number; y: number };
}

const pixelSize = 10; // Size of each pixel on screen

export function CursorOverlay({ canvasId, zoom, pan }: CursorOverlayProps) {
    const room = db.room("classCanvas", canvasId);
    const { peers } = db.rooms.usePresence(room, {
        initialPresence: {
            userName: "",
            userColor: "#0083C7",
            cursorX: 0,
            cursorY: 0,
            selectedColor: "#FFFFFF",
        },
    });

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {/* Render other users' cursors */}
            {Object.entries(peers).map(([peerId, peer]) => {
                // Convert pixel coordinates to screen coordinates
                // Account for zoom, pixel size, and pan
                const screenX = peer.cursorX * pixelSize * zoom + pan.x;
                const screenY = peer.cursorY * pixelSize * zoom + pan.y;

                return (
                    <div
                        key={peerId}
                        className="absolute pointer-events-none"
                        style={{
                            left: screenX,
                            top: screenY,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <div
                            className="size-4 rounded-full border-2 border-white shadow-lg"
                            style={{ backgroundColor: peer.userColor || "#0083C7" }}
                        />
                        <div
                            className="absolute top-5 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap"
                            style={{ fontSize: "10px" }}
                        >
                            {peer.userName}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
