/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { UserPlus, RefreshCw, Check } from "lucide-react";
import { useState } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db/db";
import { useOrganizationById } from "@/hooks/use-organization-hooks";
import { useOrgJoinCode } from "@/hooks/use-org-join-code";
import { useOrgRole } from "@/routes/organizations/-components/navigation/use-org-role";
import { generateJoinCode } from "@/lib/invite-utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute(
    "/organizations/_orgLayout/$orgId/members/invite/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const orgId = params.orgId;
    const { organization, isLoading: orgLoading } = useOrganizationById(orgId);
    const { code, codeId, isLoading: codeLoading } = useOrgJoinCode(orgId);
    const roleInfo = useOrgRole(organization);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const isLoading = orgLoading || codeLoading;
    const hasPermission = roleInfo.isOwner || roleInfo.isAdmin;

    const handleGenerateCode = async () => {
        if (!orgId) return;

        setIsGenerating(true);
        setError(null);

        try {
            const codeId = id();
            const newCode = generateJoinCode();

            db.transact([
                db.tx.orgJoinCodes[codeId].create({ code: newCode }),
                db.tx.organizations[orgId].link({ joinCodeEntity: codeId }),
            ]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to generate join code. Please try again."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateCode = async () => {
        if (!orgId || !codeId) return;

        setIsRegenerating(true);
        setError(null);

        try {
            const newCode = generateJoinCode();

            db.transact([db.tx.orgJoinCodes[codeId].update({ code: newCode })]);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to regenerate join code. Please try again."
            );
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleCopySuccess = () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (!hasPermission) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlus className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Invite Members
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                Invite new members to your organization
                            </p>
                        </div>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-6">
                        <p className="text-sm text-muted-foreground text-center">
                            You don't have permission to invite members. Only
                            organization owners and admins can manage join codes.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserPlus className="size-12 md:size-16 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                            Invite Members
                        </h1>
                        <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                            Generate and share a join code to invite teachers and
                            admins to your organization
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardContent className="py-4">
                        <p className="text-sm text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ) : code ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Join Code</CardTitle>
                        <CardDescription>
                            Share this code with users you want to invite. They
                            can enter it on the join page to become a teacher in
                            this organization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge
                                variant="outline"
                                className="text-2xl font-mono px-4 py-2 tracking-wider"
                            >
                                {code}
                            </Badge>
                            <CopyButton
                                textToCopy={code}
                                onCopySuccess={handleCopySuccess}
                                variant="outline"
                                size="default"
                            >
                                {copySuccess ? (
                                    <>
                                        <Check className="size-4" />
                                        Copied!
                                    </>
                                ) : (
                                    "Copy"
                                )}
                            </CopyButton>
                        </div>

                        <div className="flex gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={isRegenerating}
                                    >
                                        <RefreshCw
                                            className={`size-4 mr-2 ${
                                                isRegenerating
                                                    ? "animate-spin"
                                                    : ""
                                            }`}
                                        />
                                        Regenerate Code
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Regenerate Join Code?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will invalidate the current join
                                            code and generate a new one. Users
                                            who haven't joined yet will need the
                                            new code to join.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleRegenerateCode}
                                            disabled={isRegenerating}
                                        >
                                            {isRegenerating
                                                ? "Regenerating..."
                                                : "Regenerate"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="pt-4 border-t space-y-2">
                            <h3 className="text-sm font-medium">
                                How to share:
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>
                                    Copy the code above and share it with users
                                    you want to invite
                                </li>
                                <li>
                                    Users can go to the{" "}
                                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                                        /join
                                    </code>{" "}
                                    page and enter this code
                                </li>
                                <li>
                                    After joining, users will be added as
                                    teachers in this organization
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Join Code</CardTitle>
                        <CardDescription>
                            Create a join code to invite teachers and admins to
                            your organization. Users can enter this code on the
                            join page to join.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleGenerateCode}
                            disabled={isGenerating}
                            size="lg"
                            className="w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="size-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="size-4 mr-2" />
                                    Generate Join Code
                                </>
                            )}
                        </Button>

                        <div className="pt-4 border-t space-y-2">
                            <h3 className="text-sm font-medium">
                                How it works:
                            </h3>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>
                                    Generate a unique 6-character code for your
                                    organization
                                </li>
                                <li>
                                    Share the code with users you want to invite
                                </li>
                                <li>
                                    Users enter the code on the{" "}
                                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                                        /join
                                    </code>{" "}
                                    page
                                </li>
                                <li>
                                    After joining, users will be added as
                                    teachers in this organization
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
