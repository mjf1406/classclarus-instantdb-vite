/** @format */

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { EventCard } from "./event-card";
import { CreateEventDialog } from "./create-event-dialog";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type EventEntity = InstaQLEntity<AppSchema, "random_events">;

interface EventsGridProps {
    events: EventEntity[];
    classId: string;
    isLoading?: boolean;
    canManage: boolean;
}

function EventCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="w-full aspect-video rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function EventsGrid({
    events,
    classId,
    isLoading = false,
    canManage,
}: EventsGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <EventCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <Calendar className="size-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">No events yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Create your first random event to get started. Add
                            images and audio to make them more engaging!
                        </p>
                    </div>
                    {canManage && (
                        <CreateEventDialog classId={classId}>
                            <Button>
                                <Plus className="size-4 mr-2" />
                                Create Event
                            </Button>
                        </CreateEventDialog>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    classId={classId}
                    canManage={canManage}
                />
            ))}
        </div>
    );
}
