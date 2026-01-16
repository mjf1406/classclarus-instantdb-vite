/** @format */

import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/auth/auth-provider";
import { CreateClassDialog } from "@/routes/organizations/_orgLayout/$orgId/main/classes/-components/create-class-dialog";

interface CreateClassWrapperProps {
    children: React.ReactNode;
}

export function CreateClassWrapper({ children }: CreateClassWrapperProps) {
    const { organizations } = useAuthContext();
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [showOrgSelector, setShowOrgSelector] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (organizations.length === 1) {
            setSelectedOrgId(organizations[0].id);
        }
    }, [organizations]);

    useEffect(() => {
        if (selectedOrgId && triggerRef.current) {
            // Small delay to ensure dialog is mounted
            setTimeout(() => {
                triggerRef.current?.click();
            }, 100);
        }
    }, [selectedOrgId]);

    const handleOrgSelect = (orgId: string) => {
        setSelectedOrgId(orgId);
        setShowOrgSelector(false);
    };

    if (organizations.length === 0) {
        return (
            <Dialog open={showOrgSelector} onOpenChange={setShowOrgSelector}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>No Organizations</DialogTitle>
                        <DialogDescription>
                            You need to be part of an organization to create a
                            class. Please create or join an organization first.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link to="/organizations">Go to Organizations</Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (organizations.length === 1) {
        return (
            <CreateClassDialog orgId={organizations[0].id}>
                {children}
            </CreateClassDialog>
        );
    }

    return (
        <>
            <Dialog open={showOrgSelector} onOpenChange={setShowOrgSelector}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Organization</DialogTitle>
                        <DialogDescription>
                            Choose an organization to create the class in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Select
                            value={selectedOrgId}
                            onValueChange={handleOrgSelect}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an organization" />
                            </SelectTrigger>
                            <SelectContent>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogContent>
            </Dialog>
            {selectedOrgId && (
                <CreateClassDialog orgId={selectedOrgId} key={selectedOrgId}>
                    <button
                        ref={triggerRef}
                        type="button"
                        style={{ display: "none" }}
                    />
                </CreateClassDialog>
            )}
        </>
    );
}
