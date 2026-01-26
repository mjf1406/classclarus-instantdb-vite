/** @format */

import { useRef } from "react";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUploadedFile } from "@/hooks/files/use-uploaded-file";
import { XIcon, ImageIcon, MusicIcon } from "lucide-react";

interface EventFormProps {
    name: string;
    description: string;
    imageUrl: string | undefined;
    audioUrl: string | undefined;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onImageUrlChange: (url: string | undefined) => void;
    onAudioUrlChange: (url: string | undefined) => void;
    disabled?: boolean;
    error?: string | null;
    classId: string;
}

export function EventForm({
    name,
    description,
    imageUrl,
    audioUrl,
    onNameChange,
    onDescriptionChange,
    onImageUrlChange,
    onAudioUrlChange,
    disabled = false,
    error,
    classId,
}: EventFormProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const {
        uploadFile: uploadImage,
        isLoading: isUploadingImage,
        error: imageUploadError,
    } = useUploadedFile();
    const {
        uploadFile: uploadAudio,
        isLoading: isUploadingAudio,
        error: audioUploadError,
    } = useUploadedFile();

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        try {
            const path = `random-events/images/${classId}/${Date.now()}-${file.name}`;
            const uploadedFile = await uploadImage(file, path, {
                contentType: file.type,
            });

            if (uploadedFile?.url) {
                onImageUrlChange(uploadedFile.url);
            } else {
                throw new Error("Upload failed: No URL returned");
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            alert(imageUploadError || "Failed to upload image. Please try again.");
        }
    };

    const handleAudioUpload = async (file: File) => {
        if (!file.type.startsWith("audio/")) {
            alert("Please select an audio file");
            return;
        }

        try {
            const path = `random-events/audio/${classId}/${Date.now()}-${file.name}`;
            const uploadedFile = await uploadAudio(file, path, {
                contentType: file.type,
            });

            if (uploadedFile?.url) {
                onAudioUrlChange(uploadedFile.url);
            } else {
                throw new Error("Upload failed: No URL returned");
            }
        } catch (err) {
            console.error("Error uploading audio:", err);
            alert(audioUploadError || "Failed to upload audio. Please try again.");
        }
    };

    const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const handleAudioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleAudioUpload(file);
        }
        if (audioInputRef.current) {
            audioInputRef.current.value = "";
        }
    };

    const handleRemoveImage = () => {
        onImageUrlChange(undefined);
    };

    const handleRemoveAudio = () => {
        onAudioUrlChange(undefined);
    };

    return (
        <div className="space-y-4">
            <Field>
                <FieldLabel htmlFor="event-name">Name *</FieldLabel>
                <FieldContent>
                    <Input
                        id="event-name"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="e.g. Pirate Party"
                        required
                        disabled={disabled}
                    />
                </FieldContent>
            </Field>

            <Field>
                <FieldLabel htmlFor="event-description">Description</FieldLabel>
                <FieldContent>
                    <Textarea
                        id="event-description"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Enter event description..."
                        disabled={disabled}
                        className="resize-none h-24"
                    />
                </FieldContent>
            </Field>

            <Field>
                <FieldLabel>Image</FieldLabel>
                <FieldContent>
                    <div className="space-y-3">
                        {imageUrl ? (
                            <div className="relative inline-block">
                                <img
                                    src={imageUrl}
                                    alt="Event image"
                                    className="size-32 rounded-lg object-cover border"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon-sm"
                                    className="absolute -top-2 -right-2 size-5 rounded-full"
                                    onClick={handleRemoveImage}
                                    disabled={disabled || isUploadingImage}
                                >
                                    <XIcon className="size-3" />
                                    <span className="sr-only">Remove image</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageInputChange}
                                        disabled={disabled || isUploadingImage}
                                        className="hidden"
                                        id="event-image-upload"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={disabled || isUploadingImage}
                                        className="gap-2"
                                    >
                                        <ImageIcon className="size-4" />
                                        {isUploadingImage
                                            ? "Uploading..."
                                            : "Upload Image"}
                                    </Button>
                                </div>
                                {imageUploadError && (
                                    <p className="text-sm text-destructive">
                                        {imageUploadError}
                                    </p>
                                )}
                            </div>
                        )}
                        <FieldDescription>
                            Upload an image file for this event
                        </FieldDescription>
                    </div>
                </FieldContent>
            </Field>

            <Field>
                <FieldLabel>Audio</FieldLabel>
                <FieldContent>
                    <div className="space-y-3">
                        {audioUrl ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted">
                                    <MusicIcon className="size-4" />
                                    <span className="text-sm">Audio file uploaded</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleRemoveAudio}
                                    disabled={disabled || isUploadingAudio}
                                >
                                    <XIcon className="size-4 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={audioInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleAudioInputChange}
                                        disabled={disabled || isUploadingAudio}
                                        className="hidden"
                                        id="event-audio-upload"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => audioInputRef.current?.click()}
                                        disabled={disabled || isUploadingAudio}
                                        className="gap-2"
                                    >
                                        <MusicIcon className="size-4" />
                                        {isUploadingAudio
                                            ? "Uploading..."
                                            : "Upload Audio"}
                                    </Button>
                                </div>
                                {audioUploadError && (
                                    <p className="text-sm text-destructive">
                                        {audioUploadError}
                                    </p>
                                )}
                            </div>
                        )}
                        <FieldDescription>
                            Upload an audio file for this event
                        </FieldDescription>
                    </div>
                </FieldContent>
            </Field>

            {error && <FieldError>{error}</FieldError>}
        </div>
    );
}
