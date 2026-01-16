/** @format */

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2Icon, PlusIcon, UserPlus } from "lucide-react";
import { CreateOrgDialog } from "./create-org-dialog";
import { Link } from "@tanstack/react-router";

export function OrgNoOrgs() {
    return (
        <Card className="border-dashed max-w-md space-y-4 mx-auto">
            <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-center">
                    <Building2Icon className="size-24 text-muted-foreground" />
                </div>
                <CardTitle>No organizations yet</CardTitle>
                <CardDescription>
                    <div className="max-w-sm mx-auto">
                        An organization might be a{" "}
                        <span className="font-bold">school</span>, a{" "}
                        <span className="font-bold">district</span>, or just{" "}
                        <span className="font-bold">a place</span> for one
                        teacher to keep their classes.
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <CreateOrgDialog>
                    <Button className="w-full">
                        <PlusIcon />
                        Create Organization
                    </Button>
                </CreateOrgDialog>
                <Button variant="outline" className="w-full" asChild>
                    <Link to="/join/organization">
                        <UserPlus />
                        Join Organization
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
