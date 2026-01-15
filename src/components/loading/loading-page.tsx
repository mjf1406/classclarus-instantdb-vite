/** @format */

import { Loader2 } from "lucide-react";

interface LoadingPageProps {
    message?: string;
}

export default function LoadingPage({
    message = "Loading...",
}: LoadingPageProps) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-16 w-16 animate-spin text-foreground" />
                {message && (
                    <span className="text-muted-foreground text-lg">
                        {message}
                    </span>
                )}
            </div>
        </div>
    );
}
