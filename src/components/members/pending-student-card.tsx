/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, GraduationCap, Users, X } from "lucide-react";
import { db } from "@/lib/db/db";
import type { PendingMember } from "@/hooks/use-pending-members";

interface PendingStudentCardProps {
    pendingMember: PendingMember;
    canManage: boolean;
}

export function PendingStudentCard({
    pendingMember,
    canManage,
}: PendingStudentCardProps) {
    const handleRemove = async () => {
        if (!confirm("Remove this pending invitation?")) {
            return;
        }
        try {
            db.transact([db.tx.pendingMembers[pendingMember.id].delete()]);
        } catch (err) {
            console.error("Failed to remove pending member:", err);
            alert("Failed to remove pending invitation");
        }
    };

    const displayName =
        `${pendingMember.firstName || ""} ${pendingMember.lastName || ""}`.trim() ||
        pendingMember.email ||
        "Unknown";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sourceBadge = {
        google_classroom: { label: "Google Classroom", icon: GraduationCap },
        manual: { label: "Manual", icon: Users },
        csv: { label: "CSV", icon: Users },
    }[pendingMember.source || "manual"] || { label: "Unknown", icon: Users };

    const SourceIcon = sourceBadge.icon;

    return (
        <Card>
            <CardContent className="py-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-10 rounded-full bg-muted">
                        <span className="text-sm font-medium">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{displayName}</div>
                        <div className="text-sm text-muted-foreground truncate">
                            {pendingMember.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                                <Clock className="size-3 mr-1" />
                                Pending
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                <SourceIcon className="size-3 mr-1" />
                                {sourceBadge.label}
                            </Badge>
                        </div>
                    </div>
                    {canManage && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleRemove}
                        >
                            <X className="size-4" />
                            <span className="sr-only">Remove</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
