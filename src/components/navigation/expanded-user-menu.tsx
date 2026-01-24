/** @format */

import { Link, useNavigate } from "@tanstack/react-router";
import {
    User,
    CreditCard,
    LogOut,
    Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/themes/theme-switcher";
import { useAuthContext } from "@/components/auth/auth-provider";
import { db } from "@/lib/db/db";

export function ExpandedUserMenu() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    
    if (!user) return null;

    const initials =
        (user.firstName?.charAt(0) || "") + (user.lastName?.charAt(0) || "") ||
        "GU";

    const displayName = `${user.firstName || "Guest"} ${user.lastName || ""}`.trim();

    const handleSignOut = () => {
        db.auth.signOut();
        navigate({
            to: "/",
            search: { redirect: undefined },
        });
    };

    return (
        <Card className="mt-8">
            <CardContent className="py-4">
                <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarImage
                                src={
                                    user.avatarURL ||
                                    user.imageURL ||
                                    undefined
                                }
                                alt={initials || ""}
                            />
                            <AvatarFallback className="rounded-lg">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                                {displayName}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                                {user.email || user.plan || "Free"}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Theme Switcher */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Theme
                        </span>
                        <ThemeSwitcher />
                    </div>

                    <Separator />

                    {/* Menu Items */}
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            asChild
                        >
                            <Link to="/user/account">
                                <User className="size-4" />
                                Account
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            asChild
                        >
                            <Link to="/user/billing">
                                <CreditCard className="size-4" />
                                Billing
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            asChild
                        >
                            <Link to="/user/settings">
                                <Settings className="size-4" />
                                Settings
                            </Link>
                        </Button>
                    </div>

                    <Separator />

                    {/* Log Out */}
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        onClick={handleSignOut}
                    >
                        <LogOut className="size-4" />
                        Log out
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
