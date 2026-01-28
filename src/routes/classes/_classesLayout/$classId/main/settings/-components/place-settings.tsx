/** @format */

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { Palette, Save } from "lucide-react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type CanvasConfig = InstaQLEntity<AppSchema, "canvas_configs", { class: {} }>;

type CanvasConfigQueryResult = {
    canvas_configs: CanvasConfig[];
};

interface PlaceSettingsProps {
    classId: string;
}

export function PlaceSettings({ classId }: PlaceSettingsProps) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [width, setWidth] = useState(64);
    const [height, setHeight] = useState(64);
    const [cooldownSeconds, setCooldownSeconds] = useState(30);
    const [isSaving, setIsSaving] = useState(false);

    // Query existing config
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

    const typedConfigData = (configData as CanvasConfigQueryResult | undefined) ?? null;
    const existingConfig = typedConfigData?.canvas_configs?.[0];

    // Initialize state from existing config
    useEffect(() => {
        if (existingConfig) {
            setIsEnabled(existingConfig.isEnabled ?? false);
            setWidth(existingConfig.width ?? 64);
            setHeight(existingConfig.height ?? 64);
            setCooldownSeconds(existingConfig.cooldownSeconds ?? 30);
        }
    }, [existingConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const now = new Date();
            if (existingConfig) {
                // Update existing config
                db.transact([
                    db.tx.canvas_configs[existingConfig.id].update({
                        isEnabled,
                        width,
                        height,
                        cooldownSeconds,
                        updated: now,
                    }),
                ]);
            } else {
                // Create new config
                const configId = id();
                db.transact([
                    db.tx.canvas_configs[configId]
                        .create({
                            width,
                            height,
                            cooldownSeconds,
                            isEnabled,
                            created: now,
                            updated: now,
                        })
                        .link({ class: classId }),
                ]);
            }
        } catch (error) {
            console.error("Error saving Place settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Palette className="size-5 text-primary" />
                    <CardTitle>Place Settings</CardTitle>
                </div>
                <CardDescription>
                    Configure the collaborative pixel art canvas for this class
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-start space-x-3 space-y-0">
                    <Checkbox
                        id="enable-place"
                        checked={isEnabled}
                        onCheckedChange={(checked) => setIsEnabled(checked === true)}
                        className="mt-1"
                    />
                    <div className="space-y-1 leading-none">
                        <Label
                            htmlFor="enable-place"
                            className="text-base font-medium cursor-pointer"
                        >
                            Enable Place
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Allow students and teachers to use the collaborative pixel art canvas
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            When enabled, all class members can view Place. Students, assistant teachers, teachers, admins, and owners can place pixels. Guardians can view only.
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Canvas Dimensions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Canvas Dimensions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="canvas-width">Width (pixels)</Label>
                            <NumberInput
                                id="canvas-width"
                                min={16}
                                max={256}
                                step={1}
                                value={width}
                                onChange={(value) => setWidth(parseInt(value) || 16)}
                            />
                            <p className="text-xs text-muted-foreground">16-256 pixels</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="canvas-height">Height (pixels)</Label>
                            <NumberInput
                                id="canvas-height"
                                min={16}
                                max={256}
                                step={1}
                                value={height}
                                onChange={(value) => setHeight(parseInt(value) || 16)}
                            />
                            <p className="text-xs text-muted-foreground">16-256 pixels</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Cooldown */}
                <div className="space-y-2">
                    <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                    <NumberInput
                        id="cooldown"
                        min={0}
                        max={300}
                        step={1}
                        value={cooldownSeconds}
                        onChange={(value) => setCooldownSeconds(parseInt(value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Time between pixel placements per user (0 = no cooldown, max 300 seconds)
                    </p>
                </div>

                <Separator />

                {/* Save Button */}
                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    <Save className="size-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Settings"}
                </Button>
            </CardContent>
        </Card>
    );
}
