/** @format */

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import { Palette, Image, Sparkles } from "lucide-react";
import { db } from "@/lib/db/db";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

// Utility to determine if text should be white or black based on background color
function getContrastColor(hexColor: string): "white" | "black" {
    if (!hexColor) return "black";
    // Remove # if present
    const hex = hexColor.replace("#", "");
    // Validate hex color format (should be 6 characters)
    if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return "black";
    }
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "black" : "white";
}

type StudentDashboardPreferences = InstaQLEntity<
    AppSchema,
    "studentDashboardPreferences",
    { class: {}; user: {} }
>;

type PreferencesQueryResult = {
    studentDashboardPreferences: StudentDashboardPreferences[];
};

interface DashboardPreferencesProps {
    classId: string;
    studentId: string;
}

export function DashboardPreferences({
    classId,
    studentId,
}: DashboardPreferencesProps) {
    const [open, setOpen] = useState(false);
    const [icon, setIcon] = useState<string>("");
    const [color, setColor] = useState<string>("");
    const [background, setBackground] = useState<string>("");
    const [buttonColor, setButtonColor] = useState<string>("");
    const [cardBackgroundColor, setCardBackgroundColor] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Query existing preferences
    const { data: prefsData } = db.useQuery(
        studentId && classId
            ? {
                  studentDashboardPreferences: {
                      $: {
                          where: {
                              and: [
                                  { "class.id": classId },
                                  { "user.id": studentId },
                              ],
                          },
                      },
                      class: {},
                      user: {},
                  },
              }
            : null
    );

    const typedPrefsData = (prefsData as PreferencesQueryResult | undefined) ?? null;
    const existingPrefs = typedPrefsData?.studentDashboardPreferences?.[0];

    // Load existing preferences into state
    useEffect(() => {
        if (existingPrefs) {
            setIcon(existingPrefs.icon || "");
            setColor(existingPrefs.color || "");
            setBackground(existingPrefs.background || "");
            setButtonColor(existingPrefs.buttonColor || "");
            setCardBackgroundColor(existingPrefs.cardBackgroundColor || "");
        }
    }, [existingPrefs]);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const now = new Date();

            if (existingPrefs) {
                // Update existing preferences
                db.transact([
                    db.tx.studentDashboardPreferences[existingPrefs.id].update({
                        icon: icon || undefined,
                        color: color || undefined,
                        background: background || undefined,
                        buttonColor: buttonColor || undefined,
                        cardBackgroundColor: cardBackgroundColor || undefined,
                        updated: now,
                    }),
                ]);
            } else {
                // Create new preferences
                const prefsId = id();
                db.transact([
                    db.tx.studentDashboardPreferences[prefsId]
                        .create({
                            icon: icon || undefined,
                            color: color || undefined,
                            background: background || undefined,
                            buttonColor: buttonColor || undefined,
                            cardBackgroundColor: cardBackgroundColor || undefined,
                            created: now,
                            updated: now,
                        })
                        .link({ class: classId })
                        .link({ user: studentId }),
                ]);
            }

            setOpen(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to save preferences"
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Palette className="size-4" />
                    Customize
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Customize Dashboard</DialogTitle>
                    <DialogDescription>
                        Personalize your dashboard appearance
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="icon">Icon</Label>
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-muted-foreground" />
                            <Input
                                id="icon"
                                placeholder="Icon name or emoji"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter an icon name or emoji (e.g., "star", "⭐")
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="color">Color Theme</Label>
                        <div className="flex items-center gap-2">
                            <Palette className="size-4 text-muted-foreground" />
                            <Input
                                id="color"
                                type="color"
                                value={color || "#000000"}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-10 w-20 cursor-pointer"
                            />
                            <Input
                                placeholder="#000000"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Choose a primary color for your dashboard
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="background">Background Color</Label>
                        <div className="flex items-center gap-2">
                            <Image className="size-4 text-muted-foreground" />
                            <Input
                                id="background"
                                type="color"
                                value={background || "#ffffff"}
                                onChange={(e) => setBackground(e.target.value)}
                                className="h-10 w-20 cursor-pointer"
                            />
                            <Input
                                placeholder="#ffffff"
                                value={background}
                                onChange={(e) => setBackground(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Choose a background color for your dashboard
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="buttonColor">Button Color</Label>
                        <div className="flex items-center gap-2">
                            <Palette className="size-4 text-muted-foreground" />
                            <Input
                                id="buttonColor"
                                type="color"
                                value={buttonColor || "#000000"}
                                onChange={(e) => setButtonColor(e.target.value)}
                                className="h-10 w-20 cursor-pointer"
                            />
                            <Input
                                placeholder="#000000"
                                value={buttonColor}
                                onChange={(e) => setButtonColor(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Choose a color for buttons and interactive elements
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cardBackgroundColor">Card Background Color</Label>
                        <div className="flex items-center gap-2">
                            <Palette className="size-4 text-muted-foreground" />
                            <Input
                                id="cardBackgroundColor"
                                type="color"
                                value={cardBackgroundColor || "#ffffff"}
                                onChange={(e) => setCardBackgroundColor(e.target.value)}
                                className="h-10 w-20 cursor-pointer"
                            />
                            <Input
                                placeholder="#ffffff"
                                value={cardBackgroundColor}
                                onChange={(e) => setCardBackgroundColor(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Choose a background color for dashboard cards
                        </p>
                    </div>

                    {/* Live Preview */}
                    {(background || buttonColor || cardBackgroundColor || color) && (
                        <div className="space-y-2 pt-2 border-t">
                            <Label>Preview</Label>
                            <Card
                                style={{
                                    backgroundColor: cardBackgroundColor || undefined,
                                    background: background || undefined,
                                }}
                            >
                                <CardContent className="p-4 space-y-2">
                                    <div
                                        className="text-sm font-medium"
                                        style={{ color: color || undefined }}
                                    >
                                        Sample Card Title
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        This is how your cards will look
                                    </p>
                                    <Button
                                        size="sm"
                                        style={{
                                            backgroundColor: buttonColor || undefined,
                                            color: buttonColor
                                                ? getContrastColor(buttonColor)
                                                : undefined,
                                        }}
                                    >
                                        Sample Button
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
