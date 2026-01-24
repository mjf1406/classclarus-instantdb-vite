/** @format */

import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Calendar, CreditCard, Shield, Edit, Save, X, Upload, Loader2, Download, Trash2, AlertTriangle } from "lucide-react";
import { useAuthContext } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { db } from "@/lib/db/db";
import { useUploadedFile } from "@/hooks/files/use-uploaded-file";
import { DeleteAccountDialog } from "@/components/user/delete-account-dialog";
import { useExportUserData } from "@/lib/export-user-data";

export const Route = createFileRoute("/user/_userLayout/account")({
    component: RouteComponent,
});

function RouteComponent() {
    const { user } = useAuthContext();
    const exportUserData = useExportUserData();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    
    // Form state
    const [firstName, setFirstName] = useState(user.firstName || "");
    const [lastName, setLastName] = useState(user.lastName || "");
    const [displayNameForStudents, setDisplayNameForStudents] = useState(user.displayNameForStudents || "");
    const [displayNameForParents, setDisplayNameForParents] = useState(user.displayNameForParents || "");
    const [avatarURL, setAvatarURL] = useState(user.avatarURL || user.imageURL || "");
    
    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFile, isLoading: isUploading, error: uploadError } = useUploadedFile();
    
    // Update form state when user data changes
    useEffect(() => {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setDisplayNameForStudents(user.displayNameForStudents || "");
        setDisplayNameForParents(user.displayNameForParents || "");
        setAvatarURL(user.avatarURL || user.imageURL || "");
    }, [user]);

    const initials =
        (user.firstName?.charAt(0) || "") + (user.lastName?.charAt(0) || "") ||
        "GU";

    const displayName = `${user.firstName || "Guest"} ${user.lastName || ""}`.trim() || "Guest User";
    
    const displayNameForStudentsPreview = displayNameForStudents.trim() || displayName;
    const displayNameForParentsPreview = displayNameForParents.trim() || displayName;

    const createdDate = user.created_at
        ? format(new Date(user.created_at), "MMMM d, yyyy")
        : "—";

    const updatedDate = user.updated_at
        ? format(new Date(user.updated_at), "MMMM d, yyyy")
        : "—";

    const handleEdit = () => {
        setIsEditing(true);
        setError(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError(null);
        // Reset form to original values
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setDisplayNameForStudents(user.displayNameForStudents || "");
        setDisplayNameForParents(user.displayNameForParents || "");
        setAvatarURL(user.avatarURL || user.imageURL || "");
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        try {
            const path = `user-avatars/${user.id}-${Date.now()}-${file.name}`;
            const uploadedFile = await uploadFile(file, path, {
                contentType: file.type,
            });

            if (uploadedFile?.url) {
                setAvatarURL(uploadedFile.url);
                setError(null);
            } else {
                setError("Failed to upload image. Please try again.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload image");
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarURL("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const updateData: {
                firstName?: string;
                lastName?: string;
                displayNameForStudents?: string;
                displayNameForParents?: string;
                avatarURL?: string;
                updated: Date;
            } = {
                updated: new Date(),
            };

            if (firstName.trim()) {
                updateData.firstName = firstName.trim();
            }
            if (lastName.trim()) {
                updateData.lastName = lastName.trim();
            }
            // Always set display names - empty string to clear, trimmed value to set
            updateData.displayNameForStudents = displayNameForStudents.trim() || "";
            updateData.displayNameForParents = displayNameForParents.trim() || "";
            if (avatarURL) {
                updateData.avatarURL = avatarURL;
            } else {
                updateData.avatarURL = undefined;
            }

            await db.transact([
                db.tx.$users[user.id].update(updateData),
            ]);

            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportData = async () => {
        setIsExporting(true);
        setError(null);

        try {
            await exportUserData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to export data");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-primary" />
                    <h1 className="text-3xl font-bold">Account</h1>
                </div>
                {!isEditing && (
                    <Button
                        variant="outline"
                        onClick={handleEdit}
                        className="gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {uploadError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    Upload error: {uploadError}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                            Your personal account details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-16 w-16 rounded-lg">
                                    <AvatarImage
                                        src={avatarURL || undefined}
                                        alt={initials || ""}
                                    />
                                    <AvatarFallback className="rounded-lg text-lg">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                                        <Button
                                            type="button"
                                            size="icon-sm"
                                            variant="secondary"
                                            className="h-6 w-6 rounded-full"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Upload className="h-3 w-3" />
                                            )}
                                        </Button>
                                        {avatarURL && (
                                            <Button
                                                type="button"
                                                size="icon-sm"
                                                variant="destructive"
                                                className="h-6 w-6 rounded-full"
                                                onClick={handleRemoveAvatar}
                                                disabled={isUploading}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <div>
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="First name"
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Last name"
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="font-semibold text-lg truncate">
                                            {displayName}
                                        </div>
                                        {user.email && (
                                            <div className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-1">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />

                        <Separator />

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="displayNameForStudents">
                                        Display Name for Students
                                    </Label>
                                    <Input
                                        id="displayNameForStudents"
                                        value={displayNameForStudents}
                                        onChange={(e) => setDisplayNameForStudents(e.target.value)}
                                        placeholder="Leave empty to use first + last name"
                                        disabled={isSaving}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This name will appear to students. If empty, "{displayNameForStudentsPreview}" will be shown.
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="displayNameForParents">
                                        Display Name for Parents
                                    </Label>
                                    <Input
                                        id="displayNameForParents"
                                        value={displayNameForParents}
                                        onChange={(e) => setDisplayNameForParents(e.target.value)}
                                        placeholder="Leave empty to use first + last name"
                                        disabled={isSaving}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This name will appear to parents. If empty, "{displayNameForParentsPreview}" will be shown.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        First Name
                                    </span>
                                    <span className="text-sm font-medium">
                                        {user.firstName || "—"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Last Name
                                    </span>
                                    <span className="text-sm font-medium">
                                        {user.lastName || "—"}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Name for Students
                                    </span>
                                    <span className="text-sm font-medium">
                                        {displayNameForStudentsPreview}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Name for Parents
                                    </span>
                                    <span className="text-sm font-medium">
                                        {displayNameForParentsPreview}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        User Type
                                    </span>
                                    <span className="text-sm font-medium capitalize">
                                        {user.type || "guest"}
                                    </span>
                                </div>
                                {user.isGuest && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span>Guest Account</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Account Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>
                            Subscription and account information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Plan
                                </span>
                                <span className="text-sm font-medium capitalize">
                                    {user.plan || "Free"}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Member Since
                                </span>
                                <span className="text-sm font-medium">
                                    {createdDate}
                                </span>
                            </div>
                            {user.updated_at && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Last Updated
                                        </span>
                                        <span className="text-sm font-medium">
                                            {updatedDate}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Irreversible and destructive actions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="font-medium">Export Your Data</h3>
                                <p className="text-sm text-muted-foreground">
                                    Download all your account data as a JSON file
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="gap-2"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        Export Data
                                    </>
                                )}
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="font-medium text-destructive">
                                    Delete Account
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Permanently delete your account and all
                                    associated data. This action cannot be undone.
                                </p>
                            </div>
                            <DeleteAccountDialog userEmail={user.email || ""}>
                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Account
                                </Button>
                            </DeleteAccountDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isEditing && (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isUploading}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
