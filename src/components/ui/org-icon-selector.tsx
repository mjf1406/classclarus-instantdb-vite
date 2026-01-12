/** @format */

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field";
import { useUploadedFile } from "@/hooks/files/use-uploaded-file";
import { UploadIcon, XIcon, ImageIcon, SmileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconType = "emoji" | "image";

interface OrgIconSelectorProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    disabled?: boolean;
}

// Helper functions to determine and parse icon type
function getIconType(value?: string): IconType {
    if (!value) return "emoji";
    // Legacy icon: prefix values are treated as emoji (fallback)
    if (value.startsWith("icon:")) return "emoji";
    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:")
    )
        return "image";
    return "emoji";
}

function parseIconValue(value?: string): {
    type: IconType;
    emoji?: string;
    imageUrl?: string;
} {
    const type = getIconType(value);
    if (!value) return { type: "emoji" };

    if (type === "image") {
        return { type, imageUrl: value };
    }
    return { type, emoji: value };
}

export function OrgIconSelector({
    value,
    onChange,
    disabled,
}: OrgIconSelectorProps) {
    const [activeTab, setActiveTab] = useState<IconType>(getIconType(value));
    const [emoji, setEmoji] = useState(parseIconValue(value).emoji || "");
    const [imageUrl, setImageUrl] = useState(
        parseIconValue(value).imageUrl || ""
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        uploadFile,
        isLoading: isUploading,
        error: uploadError,
    } = useUploadedFile();

    // Update local state when value prop changes
    useEffect(() => {
        const currentValue = parseIconValue(value);
        // If the value is an icon type (icon: prefix), treat it as emoji as fallback
        if (value?.startsWith("icon:")) {
            setActiveTab("emoji");
            setEmoji("🏢");
        } else {
            setActiveTab(currentValue.type);
            setEmoji(currentValue.emoji || "");
            setImageUrl(currentValue.imageUrl || "");
        }
    }, [value]);

    const handleEmojiChange = (newEmoji: string) => {
        setEmoji(newEmoji);
        onChange?.(newEmoji.trim() || undefined);
    };

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        try {
            const path = `org-icons/${Date.now()}-${file.name}`;
            const uploadedFile = await uploadFile(file, path, {
                contentType: file.type,
            });

            if (uploadedFile?.url) {
                setImageUrl(uploadedFile.url);
                onChange?.(uploadedFile.url);
            } else {
                throw new Error("Upload failed: No URL returned");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert(uploadError || "Failed to upload image. Please try again.");
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveImage = () => {
        setImageUrl("");
        onChange?.(undefined);
    };

    const handleTabChange = (newTab: string) => {
        const newTabType = newTab as IconType;
        setActiveTab(newTabType);
        // When switching tabs, only clear if switching to a different type
        // The useEffect will handle updating local state when value changes
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                    type="button"
                    variant={activeTab === "emoji" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleTabChange("emoji")}
                    disabled={disabled}
                    className="gap-1.5 flex-1"
                >
                    <SmileIcon className="size-3.5" />
                    Emoji
                </Button>
                <Button
                    type="button"
                    variant={activeTab === "image" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleTabChange("image")}
                    disabled={disabled}
                    className="gap-1.5 flex-1"
                >
                    <ImageIcon className="size-3.5" />
                    Image
                </Button>
            </div>

            {activeTab === "emoji" && (
                <Field>
                    <FieldLabel>Emoji Icon</FieldLabel>
                    <FieldContent>
                        <Input
                            value={emoji}
                            onChange={(e) => handleEmojiChange(e.target.value)}
                            placeholder="🏢"
                            maxLength={2}
                            disabled={disabled}
                        />
                        <FieldDescription>
                            Enter an emoji (1-2 characters)
                        </FieldDescription>
                    </FieldContent>
                </Field>
            )}

            {activeTab === "image" && (
                <Field>
                    <FieldLabel>Image Icon</FieldLabel>
                    <FieldContent>
                        <div className="space-y-3">
                            {imageUrl ? (
                                <div className="relative inline-block">
                                    <img
                                        src={imageUrl}
                                        alt="Organization icon"
                                        className="size-16 rounded-lg object-cover border"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-sm"
                                        className="absolute -top-2 -right-2 size-5 rounded-full"
                                        onClick={handleRemoveImage}
                                        disabled={disabled || isUploading}
                                    >
                                        <XIcon className="size-3" />
                                        <span className="sr-only">
                                            Remove image
                                        </span>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileInputChange}
                                            disabled={disabled || isUploading}
                                            className="hidden"
                                            id="org-icon-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={disabled || isUploading}
                                            className="gap-2"
                                        >
                                            <UploadIcon className="size-4" />
                                            {isUploading
                                                ? "Uploading..."
                                                : "Upload Image"}
                                        </Button>
                                    </div>
                                    {uploadError && (
                                        <p className="text-sm text-destructive">
                                            {uploadError}
                                        </p>
                                    )}
                                </div>
                            )}
                            <FieldDescription>
                                Upload an image file to use as your organization
                                icon
                            </FieldDescription>
                        </div>
                    </FieldContent>
                </Field>
            )}
        </div>
    );
}

// Component to render the icon based on its type
interface OrgIconDisplayProps {
    icon?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function OrgIconDisplay({
    icon,
    className,
    size = "md",
}: OrgIconDisplayProps) {
    if (!icon) {
        return (
            <div
                className={cn(
                    "shrink-0 flex items-center justify-center bg-muted rounded",
                    className,
                    {
                        "size-8 text-xl": size === "sm",
                        "size-12 text-2xl": size === "md",
                        "size-16 text-3xl": size === "lg",
                    }
                )}
            >
                🏢
            </div>
        );
    }

    const type = getIconType(icon);
    const sizeClasses = {
        sm: "size-8",
        md: "size-12",
        lg: "size-16",
    };

    // If icon type (icon: prefix), show fallback emoji
    if (icon?.startsWith("icon:")) {
        return (
            <div
                className={cn(
                    "shrink-0 flex items-center justify-center bg-muted rounded",
                    className,
                    {
                        "size-8 text-xl": size === "sm",
                        "size-12 text-2xl": size === "md",
                        "size-16 text-3xl": size === "lg",
                    }
                )}
            >
                🏢
            </div>
        );
    }

    if (type === "image") {
        return (
            <img
                src={icon}
                alt="Organization icon"
                className={cn(
                    "shrink-0 rounded object-cover",
                    className,
                    sizeClasses[size]
                )}
            />
        );
    }

    // Emoji
    return (
        <div
            className={cn(
                "shrink-0 flex items-center justify-center",
                className,
                {
                    "text-xl": size === "sm",
                    "text-2xl": size === "md",
                    "text-3xl": size === "lg",
                }
            )}
        >
            {icon}
        </div>
    );
}
