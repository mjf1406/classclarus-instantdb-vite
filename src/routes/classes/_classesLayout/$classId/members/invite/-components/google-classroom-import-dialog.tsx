/** @format */

import { useState, useEffect } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { GoogleClassroomButton } from "@/components/auth/google-oauth";

interface GoogleClassroomClass {
    id: string;
    name: string;
    section?: string;
}

interface StudentPreview {
    email: string;
    firstName: string;
    lastName: string;
}

interface GoogleClassroomImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: string;
    onImportComplete?: () => void;
}

// Inner component that uses the Google OAuth hook
function GoogleClassroomImportDialogContent({
    open,
    onOpenChange,
    classId,
    onImportComplete,
}: GoogleClassroomImportDialogProps) {
    const { user } = useAuthContext();
    const [step, setStep] = useState<"connect" | "select" | "preview" | "importing" | "success">("connect");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [classes, setClasses] = useState<GoogleClassroomClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [students, setStudents] = useState<StudentPreview[]>([]);
    const [importResult, setImportResult] = useState<{
        imported: number;
        added: number;
        pending: number;
        skipped: number;
    } | null>(null);

    // Check if Google is connected
    useEffect(() => {
        if (open && user?.id) {
            checkConnection();
        }
    }, [open, user?.id]);

    const checkConnection = async () => {
        if (!user?.refresh_token) return;

        try {
            const response = await fetch("/api/google-classroom/classes", {
                headers: {
                    token: user.refresh_token,
                },
            });

            if (response.ok) {
                setStep("select");
                await loadClasses();
            } else if (response.status === 401) {
                setStep("connect");
            } else {
                throw new Error("Failed to check connection");
            }
        } catch (err) {
            console.error("Error checking connection:", err);
            setStep("connect");
        }
    };

    const handleDisconnect = async () => {
        if (!user?.refresh_token) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/google-classroom/disconnect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: user.refresh_token,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to disconnect");
            }

            // Reset state and go to connect step
            setStep("connect");
            setClasses([]);
            setSelectedClassId("");
            setStudents([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to disconnect");
        } finally {
            setIsLoading(false);
        }
    };

    // Use Google OAuth login hook with authorization code flow
    const googleLogin = useGoogleLogin({
        flow: 'auth-code',
        scope: 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails',
        onSuccess: async (codeResponse) => {
            if (!user?.refresh_token) {
                setError("You must be logged in to connect Google Classroom");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Send authorization code to backend to exchange for tokens
                const response = await fetch("/api/google-classroom/exchange", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        token: user.refresh_token,
                    },
                    body: JSON.stringify({
                        code: codeResponse.code,
                        redirectUri: window.location.origin,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to exchange authorization code");
                }

                // Connection successful
                setError(null);
                setStep("select");
                await loadClasses();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to connect");
            } finally {
                setIsLoading(false);
            }
        },
        onError: (errorResponse) => {
            setIsLoading(false);
            const errorCode = errorResponse.error;
            const errorString = String(errorCode || '');
            if (errorString.includes('popup_closed') || errorString.includes('popup_blocked') || errorString.includes('cancelled')) {
                setError("Connection cancelled. Please try again.");
            } else {
                setError(`Google login failed: ${errorString || 'Unknown error'}`);
            }
        },
    });

    const handleConnect = () => {
        if (!user?.refresh_token) {
            setError("You must be logged in to connect Google Classroom");
            return;
        }

        setIsLoading(true);
        setError(null);
        googleLogin();
    };

    const loadClasses = async () => {
        if (!user?.refresh_token) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/google-classroom/classes", {
                headers: {
                    token: user.refresh_token,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load classes");
            }

            setClasses(data.classes || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load classes");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClassSelect = async (classroomId: string) => {
        if (!user?.refresh_token) return;

        setSelectedClassId(classroomId);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/google-classroom/students/${classroomId}`,
                {
                    headers: {
                        token: user.refresh_token,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load students");
            }

            setStudents(data.students || []);
            setStep("preview");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load students");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!user?.refresh_token || !selectedClassId) return;

        setStep("importing");
        setError(null);

        try {
            const response = await fetch("/api/google-classroom/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: user.refresh_token,
                },
                body: JSON.stringify({
                    classroomId: selectedClassId,
                    targetClassId: classId,
                    role: "student",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to import students");
            }

            setImportResult(data);
            setStep("success");
            onImportComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to import students");
            setStep("preview");
        }
    };

    const handleClose = () => {
        if (step === "importing") return; // Prevent closing during import
        setStep("connect");
        setError(null);
        setClasses([]);
        setSelectedClassId("");
        setStudents([]);
        setImportResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import from Google Classroom</DialogTitle>
                    <DialogDescription>
                        Import students from your Google Classroom classes
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {step === "connect" && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Connect your Google account to import students from
                                Google Classroom.
                            </p>
                            <div className="flex justify-center">
                                <GoogleClassroomButton
                                    onClick={handleConnect}
                                    disabled={isLoading}
                                    isLoading={isLoading}
                                    />
                            </div>
                        </div>
                    )}

                    {step === "select" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Select a Google Classroom class to import students from.
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDisconnect}
                                    disabled={isLoading}
                                    className="text-xs"
                                >
                                    Reconnect
                                </Button>
                            </div>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : classes.length === 0 ? (
                                <Alert>
                                    <AlertDescription>
                                        No active Google Classroom classes found.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Select
                                    value={selectedClassId}
                                    onValueChange={handleClassSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name}
                                                {cls.section && ` - ${cls.section}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Preview students to import:
                            </p>
                            <div className="max-h-[300px] overflow-y-auto border rounded-md p-4">
                                {students.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No students found in this class.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {students.map((student, index) => (
                                            <li
                                                key={index}
                                                className="text-sm flex items-center gap-2"
                                            >
                                                <span className="font-medium">
                                                    {student.firstName} {student.lastName}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    ({student.email})
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {students.length} student{students.length !== 1 ? "s" : ""} will be
                                imported as pending members. They will be automatically added to the
                                class when they sign up with the same email.
                            </p>
                        </div>
                    )}

                    {step === "importing" && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Importing students...
                            </p>
                        </div>
                    )}

                    {step === "success" && importResult && (
                        <div className="space-y-4">
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    Successfully imported {importResult.imported} student
                                    {importResult.imported !== 1 ? "s" : ""}!
                                    {importResult.added > 0 && (
                                        <span className="block mt-1">
                                            {importResult.added} student
                                            {importResult.added !== 1 ? "s" : ""} {importResult.added === 1 ? "was" : "were"} added directly to the class.
                                        </span>
                                    )}
                                    {importResult.pending > 0 && (
                                        <span className="block mt-1">
                                            {importResult.pending} student
                                            {importResult.pending !== 1 ? "s" : ""} {importResult.pending === 1 ? "was" : "were"} added as pending members.
                                        </span>
                                    )}
                                    {importResult.skipped > 0 && (
                                        <span className="block mt-1">
                                            {importResult.skipped} student
                                            {importResult.skipped !== 1 ? "s" : ""} already
                                            exist{importResult.skipped === 1 ? "s" : ""} in the class and
                                            {importResult.skipped === 1 ? " was" : " were"}{" "}
                                            skipped.
                                        </span>
                                    )}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === "connect" && (
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                    )}
                    {step === "select" && (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={loadClasses}
                                disabled={isLoading}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleDisconnect}
                                disabled={isLoading}
                                className="text-xs"
                            >
                                Reconnect
                            </Button>
                        </>
                    )}
                    {step === "preview" && (
                        <>
                            <Button variant="outline" onClick={() => setStep("select")}>
                                Back
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={students.length === 0 || isLoading}
                            >
                                Import {students.length} Student
                                {students.length !== 1 ? "s" : ""}
                            </Button>
                        </>
                    )}
                    {step === "success" && (
                        <Button onClick={handleClose}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Wrapper component that provides GoogleOAuthProvider for Google Classroom
export function GoogleClassroomImportDialog({
    open,
    onOpenChange,
    classId,
    onImportComplete,
}: GoogleClassroomImportDialogProps) {
    const gcClientId = import.meta.env.VITE_GC_CLIENT_ID;
    
    if (!gcClientId) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Google Classroom OAuth is not configured. Please set VITE_GC_CLIENT_ID environment variable.
                        </AlertDescription>
                    </Alert>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <GoogleOAuthProvider clientId={gcClientId}>
            <GoogleClassroomImportDialogContent
                open={open}
                onOpenChange={onOpenChange}
                classId={classId}
                onImportComplete={onImportComplete}
            />
        </GoogleOAuthProvider>
    );
}
