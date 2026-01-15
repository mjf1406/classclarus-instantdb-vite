/** @format */

import { useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useAuthContext } from "@/components/auth/auth-provider";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";
import LoadingPage from "@/components/loading/loading-page";
import { LoginCard } from "@/routes/login/-components/login-card";

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
        } else if (!isLoading && user?.id && !search.redirect) {
            // If authenticated and no redirect, go to organizations
            navigate({ to: "/organizations" });
        }
    }, [user, isLoading, search.redirect, navigate]);

    if (isLoading) {
        return <LoadingPage />;
    }

    // If user is authenticated, don't render login (redirect will happen)
    if (user?.id) {
        return null;
    }

    // User is not logged in - show login page
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeSwitcher />
            </div>
            <LoginCard />
        </div>
    );
}
