/** @format */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import { useAuthContext } from "@/components/auth/auth-provider";
import { useNavigate } from "@tanstack/react-router";
import { db } from "@/lib/db/db";

export function UserCard() {
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
                            {user.email && (
                                <div className="text-sm text-muted-foreground truncate">
                                    {user.email}
                                </div>
                            )}
                        </div>
                    </div>
                    <Separator />
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
