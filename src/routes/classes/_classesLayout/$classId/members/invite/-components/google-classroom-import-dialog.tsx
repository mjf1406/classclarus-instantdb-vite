/** @format */

import { useState, useEffect } from "react";
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

export function GoogleClassroomImportDialog({
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
        skipped: number;
        pending: number;
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

    const handleConnect = async () => {
        if (!user?.refresh_token) {
            setError("You must be logged in to connect Google Classroom");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/google-classroom/connect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: user.refresh_token,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to initiate OAuth");
            }

            // Open Google OAuth in new window
            const authWindow = window.open(
                data.authUrl,
                "Google Classroom Authorization",
                "width=500,height=600"
            );

            // Listen for postMessage from popup
            const messageHandler = (event: MessageEvent) => {
                // In production, you should verify event.origin for security
                if (event.data?.type === 'google-classroom-connected') {
                    window.removeEventListener('message', messageHandler);
                    if (authWindow) {
                        authWindow.close();
                    }
                    if (event.data.success) {
                        setError(null);
                        setStep("select");
                        loadClasses();
                    } else {
                        setError(event.data.error || "Connection failed");
                        setStep("connect");
                    }
                    setIsLoading(false);
                }
            };

            window.addEventListener('message', messageHandler);

            // Fallback: Poll for window close (in case postMessage doesn't work)
            const checkInterval = setInterval(async () => {
                if (authWindow?.closed) {
                    clearInterval(checkInterval);
                    window.removeEventListener('message', messageHandler);
                    // Check if connection succeeded
                    await checkConnection();
                }
            }, 1000);

            // Timeout after 5 minutes
            setTimeout(() => {
                clearInterval(checkInterval);
                window.removeEventListener('message', messageHandler);
                if (authWindow && !authWindow.closed) {
                    authWindow.close();
                    setError("Connection timed out. Please try again.");
                    setIsLoading(false);
                }
            }, 300000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect");
            setIsLoading(false);
        }
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
                            <Button
                                onClick={handleConnect}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    "Connect Google Account"
                                )}
                            </Button>
                        </div>
                    )}

                    {step === "select" && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Select a Google Classroom class to import students from.
                            </p>
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
                                    {importResult.skipped > 0 && (
                                        <span className="block mt-1">
                                            {importResult.skipped} student
                                            {importResult.skipped !== 1 ? "s" : ""} already
                                            exist{importResult.skipped === 1 ? "s" : ""} and
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
