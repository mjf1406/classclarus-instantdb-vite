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
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

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
                        <Label htmlFor="background">Background</Label>
                        <div className="flex items-center gap-2">
                            <Image className="size-4 text-muted-foreground" />
                            <Input
                                id="background"
                                placeholder="Background URL or CSS value"
                                value={background}
                                onChange={(e) => setBackground(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter a background image URL or CSS value (e.g., "linear-gradient(...)")
                        </p>
                    </div>

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
