/** @format */

import { useEffect } from "react";
import {
    createFileRoute,
    useNavigate,
    useSearch,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/components/auth/auth-provider";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";
import { LoginCard } from "@/routes/login/-components/login-card";
import { HomeSelection } from "./-components/home-selection";
import { LogoBig } from "@/components/brand/logo";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/")({
    component: Index,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            redirect: (search.redirect as string) || undefined,
        };
    },
});

function Index() {
    const { user, isLoading } = useAuthContext();
    const navigate = useNavigate();
    const search = useSearch({ from: "/" });

    // If user is authenticated and there's a redirect param, navigate to it
    useEffect(() => {
        if (!isLoading && user?.id && search.redirect) {
            navigate({ to: search.redirect as string });
        }
    }, [user, isLoading, search.redirect, navigate]);

    // If user is authenticated, show home selection (no auto-redirect)
    return (
        <div className="relative min-h-screen">
            <div className="fixed top-4 right-4 z-10">
                <ThemeSwitcher />
            </div>
            {user?.id ? (
                isLoading ? (
                    // Authenticated but data is still loading
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader className="text-center space-y-3">
                                <div className="flex justify-center">
                                    <LogoBig />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">
                                        Logging you in...
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex justify-center py-6">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    // Authenticated and data loaded
                    <>
                        <div className="mt-8">
                            <LogoBig />
                        </div>
                        <HomeSelection />
                    </>
                )
            ) : (
                // Not authenticated
                <div className="flex min-h-screen items-center justify-center p-4">
                    <LoginCard />
                </div>
            )}
        </div>
    );
}
