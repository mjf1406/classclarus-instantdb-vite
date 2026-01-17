/** @format */

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { UnderConstruction } from "@/components/under-construction";
import { RestrictedRoute } from "@/components/auth/restricted-route";
import { useClassById } from "@/hooks/use-class-hooks";
import { useClassRole } from "@/hooks/use-class-role";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute(
    "/classes/_classesLayout/$classId/reading/"
)({
    component: RouteComponent,
});

function RouteComponent() {
    const params = useParams({ strict: false });
    const classId = params.classId;
    const { class: classEntity, isLoading } = useClassById(classId);
    const roleInfo = useClassRole(classEntity);
    const [activeTab, setActiveTab] = useState<string>("raz");

    return (
        <RestrictedRoute
            role={roleInfo.role}
            isLoading={isLoading}
            backUrl={classId ? `/classes/${classId}` : "/classes"}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="size-12 md:size-16 text-primary" />
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                Reading
                            </h1>
                            <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                                View and manage reading for your class
                            </p>
                        </div>
                    </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="raz">RAZ</TabsTrigger>
                        <TabsTrigger value="ufli">UFLI</TabsTrigger>
                    </TabsList>
                    <TabsContent value="raz" className="mt-6">
                        <div className="h-[calc(100vh-12rem)]">
                            <UnderConstruction />
                        </div>
                    </TabsContent>
                    <TabsContent value="ufli" className="mt-6">
                        <div className="h-[calc(100vh-12rem)]">
                            <UnderConstruction />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </RestrictedRoute>
    );
}
