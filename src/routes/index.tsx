/** @format */

import { useEffect } from "react";
import {
    createFileRoute,
    useNavigate,
    useSearch,
} from "@tanstack/react-router";
import { useAuthContext } from "@/components/auth/auth-provider";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";
import LoadingPage from "@/components/loading/loading-page";
import { LoginCard } from "@/routes/login/-components/login-card";
import { HomeSelection } from "./-components/home-selection";
import { LogoBig } from "@/components/brand/logo";

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

    if (isLoading) {
        return <LoadingPage />;
    }

    // If user is authenticated, show home selection (no auto-redirect)
    return (
        <div className="relative min-h-screen">
            <div className="fixed top-4 right-4 z-10">
                <ThemeSwitcher />
            </div>
            {user?.id ? (
                <>
                    <div className="mt-8">
                        <LogoBig />
                    </div>
                    <HomeSelection />
                </>
            ) : (
                <div className="flex min-h-screen items-center justify-center p-4">
                    <LoginCard />
                </div>
            )}
        </div>
    );
}
