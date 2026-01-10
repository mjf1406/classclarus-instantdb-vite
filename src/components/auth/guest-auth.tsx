/** @format */

import { LogIn } from "lucide-react";
import { Button } from "../ui/button";
import { db } from "@/lib/db/db";

const handleGuestSignIn = () => {
    db.auth
        .signInAsGuest()
        .then(async (result) => {
            if (result.user) {
                db.transact(
                    db.tx.$users[result.user.id].update({
                        created: new Date(),
                        lastLogon: new Date(),
                    })
                );
            }
        })
        .catch((err) => {
            console.error("Error signing in as guest:", err);
            alert(
                "Failed to sign in as guest: " +
                    (err.body?.message || err.message)
            );
        });
};

export default function TryAsGuestButton() {
    return (
        <Button
            onClick={handleGuestSignIn}
            variant="outline"
            className="w-full items-center gap-2 justify-start"
            size="lg"
        >
            <LogIn />
            Try as Guest
        </Button>
    );
}
