/** @format */

import { ChevronUp } from "lucide-react";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "../ui/collapsible";
import { useState } from "react";

const GUEST_MODE_LIMITATIONS = [
    "You can only create organizations, not join them.",
    "You can only create classes, not join them.",
    "Teachers cannot join the classes you create.",
    "Guardians cannot join the classes you create.",
    "Students cannot join the classes you create.",
];

export default function GuestLimitations() {
    const [isGuestLimitationsOpen, setIsGuestLimitationsOpen] = useState(true);

    return (
        <div className="mt-5">
            <p className="text-sm text-muted-foreground">
                The following additional limitations exist for many reasons,
                including, but not limited to, protecting the privacy of
                non-guests.
            </p>
            <Collapsible
                open={isGuestLimitationsOpen}
                onOpenChange={setIsGuestLimitationsOpen}
                className="mt-5 mb-5"
            >
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                    <ChevronUp
                        className={`h-4 w-4 transition-transform duration-200 ${
                            isGuestLimitationsOpen ? "rotate-180" : ""
                        }`}
                    />
                    Guest Limitations
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-4">
                        {GUEST_MODE_LIMITATIONS.map((limitation, index) => (
                            <li key={index}>{limitation}</li>
                        ))}
                    </ul>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
