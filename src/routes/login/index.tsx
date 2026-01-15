/** @format */

import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "@/components/auth/auth-provider";
import { LoginCard } from "./-components/login-card";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";
import LoadingPage from "@/components/loading/loading-page";

export const Route = createFileRoute("/login/")({
    component: Login,
});

function Login() {
    const { user, isLoading } = useAuthContext();
    const navigate = useNavigate();

    // Redirect to /organizations if user is already authenticated
    useEffect(() => {
        if (!isLoading && user?.id) {
            navigate({ to: "/organizations" });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return <LoadingPage />;
    }

    // If user is authenticated, don't render anything (redirect will happen)
    if (user?.id) {
        return null;
    }

    // User is not logged in - show login options
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeSwitcher />
            </div>
            <LoginCard />
        </div>
    );
}
