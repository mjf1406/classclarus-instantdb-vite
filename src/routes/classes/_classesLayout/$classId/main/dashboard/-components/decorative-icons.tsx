/** @format */

import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { resolveIconId } from "@/lib/fontawesome-icon-catalog";

interface DecorativeIconsProps {
    iconId: string | null | undefined;
    color: string | null | undefined;
    seed?: string; // For consistent random placement
}

// Seeded random number generator for consistent placement
function seededRandom(seed: string): () => number {
    let value = 0;
    for (let i = 0; i < seed.length; i++) {
        value = ((value << 5) - value + seed.charCodeAt(i)) | 0;
    }
    return () => {
        value = ((value * 1664525) + 1013904223) | 0;
        return ((value >>> 0) / 4294967296);
    };
}

interface IconPlacement {
    top: number;
    left: number;
    size: number;
    rotation: number;
    opacity: number;
}

export function DecorativeIcons({ iconId, color, seed = "default" }: DecorativeIconsProps) {
    const [iconDefinition, setIconDefinition] = useState<IconDefinition | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load icon definition
    useEffect(() => {
        if (!iconId) {
            setIconDefinition(null);
            return;
        }

        setIsLoading(true);
        resolveIconId(iconId)
            .then((icon) => {
                if (icon) {
                    setIconDefinition(icon);
                } else {
                    console.warn(`Failed to resolve icon: ${iconId}`);
                }
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(`Error loading icon ${iconId}:`, error);
                setIconDefinition(null);
                setIsLoading(false);
            });
    }, [iconId]);

    // Generate background icon placements
    const backgroundIcons = useMemo(() => {
        if (!iconDefinition || !iconId) return [];

        const random = seededRandom(`${seed}-bg-${iconId}`);
        const count = 15; // Number of background icons
        const placements: IconPlacement[] = [];

        for (let i = 0; i < count; i++) {
            placements.push({
                top: random() * 100, // 0-100% of container height
                left: random() * 100, // 0-100% of container width
                size: 32 + random() * 48, // 32-80px (larger for visibility)
                rotation: -45 + random() * 90, // -45 to +45 degrees
                opacity: 0.2 + random() * 0.2, // 0.2-0.4 opacity (more visible)
            });
        }

        return placements;
    }, [iconDefinition, iconId, seed]);

    if (!iconId || !color) {
        return null;
    }

    if (isLoading || !iconDefinition) {
        return null; // Don't render while loading or if icon failed to load
    }

    if (backgroundIcons.length === 0) {
        return null;
    }

    return (
        <>
            {/* Background Icons Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 1 }}>
                {backgroundIcons.map((placement, index) => (
                    <div
                        key={`bg-${index}`}
                        className="absolute"
                        style={{
                            top: `${placement.top}%`,
                            left: `${placement.left}%`,
                            transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                            opacity: placement.opacity,
                            color: color,
                        }}
                    >
                        <FontAwesomeIcon
                            icon={iconDefinition}
                            style={{
                                fontSize: `${placement.size}px`,
                            }}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

// Component for rendering icons on card edges
export function DecorativeCardWrapper({
    children,
    iconId,
    color,
    seed,
    cardIndex,
}: {
    children: React.ReactNode;
    iconId: string | null | undefined;
    color: string | null | undefined;
    seed?: string;
    cardIndex: number;
}) {
    const [iconDefinition, setIconDefinition] = useState<IconDefinition | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!iconId) {
            setIconDefinition(null);
            return;
        }

        setIsLoading(true);
        resolveIconId(iconId)
            .then((icon) => {
                setIconDefinition(icon);
                setIsLoading(false);
            })
            .catch(() => {
                setIconDefinition(null);
                setIsLoading(false);
            });
    }, [iconId]);

    const edgeIcons = useMemo(() => {
        if (!iconDefinition || !iconId) return [];

        const random = seededRandom(`${seed || "default"}-card-${cardIndex}-${iconId}`);
        const count = 2 + Math.floor(random() * 3); // 2-4 icons per card
        const placements: Array<{
            top?: number | string;
            bottom?: number | string;
            left?: number | string;
            right?: number | string;
            transform: string;
            size: number;
            rotation: number;
            opacity: number;
        }> = [];

        // Edge positions with transform info
        const edgePositions: Array<{
            top?: number | string;
            bottom?: number | string;
            left?: number | string;
            right?: number | string;
            transform: string;
        }> = [
            { top: -8, left: -8, transform: "translate(0, 0)" }, // top-left
            { top: -8, right: -8, transform: "translate(100%, 0)" }, // top-right
            { bottom: -8, left: -8, transform: "translate(0, 100%)" }, // bottom-left
            { bottom: -8, right: -8, transform: "translate(100%, 100%)" }, // bottom-right
            { top: -8, left: "50%", transform: "translate(-50%, 0)" }, // top-center
            { bottom: -8, left: "50%", transform: "translate(-50%, 100%)" }, // bottom-center
            { top: "50%", left: -8, transform: "translate(0, -50%)" }, // left-center
            { top: "50%", right: -8, transform: "translate(100%, -50%)" }, // right-center
        ];

        for (let i = 0; i < count; i++) {
            const edge = edgePositions[Math.floor(random() * edgePositions.length)];
            const rotation = -30 + random() * 60;
            placements.push({
                top: edge.top,
                bottom: edge.bottom,
                left: edge.left,
                right: edge.right,
                transform: `${edge.transform} rotate(${rotation}deg)`,
                size: 20 + random() * 16,
                rotation: rotation,
                opacity: 0.4 + random() * 0.2,
            });
        }

        return placements;
    }, [iconDefinition, iconId, seed, cardIndex]);

    if (!iconDefinition || isLoading || !color) {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            {children}
            {/* Card Edge Icons */}
            <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
                {edgeIcons.map((placement, index) => (
                    <div
                        key={`edge-${index}`}
                        className="absolute"
                        style={{
                            top: typeof placement.top === "string" ? placement.top : placement.top !== undefined ? `${placement.top}px` : undefined,
                            bottom: typeof placement.bottom === "string" ? placement.bottom : placement.bottom !== undefined ? `${placement.bottom}px` : undefined,
                            left: typeof placement.left === "string" ? placement.left : placement.left !== undefined ? `${placement.left}px` : undefined,
                            right: typeof placement.right === "string" ? placement.right : placement.right !== undefined ? `${placement.right}px` : undefined,
                            transform: placement.transform,
                            opacity: placement.opacity,
                            color: color,
                        }}
                    >
                        <FontAwesomeIcon
                            icon={iconDefinition}
                            style={{
                                fontSize: `${placement.size}px`,
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
