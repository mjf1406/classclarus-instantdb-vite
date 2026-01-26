/** @format */

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { CardActionMenu } from "@/routes/classes/_classesLayout/$classId/behavior/-components/card-action-menu";
import { EditEventDialog } from "./edit-event-dialog";
import { DeleteEventDialog } from "./delete-event-dialog";
import { ImageIcon, MusicIcon, Calendar, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type EventEntity = InstaQLEntity<AppSchema, "random_events", { rolls?: {} }>;

interface EventCardProps {
    event: EventEntity;
    classId: string;
    canManage: boolean;
}

export function EventCard({ event, classId, canManage }: EventCardProps) {
    return (
        <Card className="relative">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg line-clamp-2">
                            {event.name}
                        </CardTitle>
                        {event.description && (
                            <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                            </p>
                        )}
                    </div>
                    {canManage && (
                        <CardActionMenu>
                            <EditEventDialog
                                event={event}
                                classId={classId}
                                asDropdownItem
                            >
                                Edit
                            </EditEventDialog>
                            <DeleteEventDialog event={event} asDropdownItem>
                                Delete
                            </DeleteEventDialog>
                        </CardActionMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {event.imageUrl && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                            <img
                                src={event.imageUrl}
                                alt={event.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        {event.imageUrl && (
                            <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                <ImageIcon className="size-3" />
                                <span>Image</span>
                            </div>
                        )}
                        {event.audioUrl && (
                            <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                <MusicIcon className="size-3" />
                                <span>Audio</span>
                            </div>
                        )}
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            <BarChart3 className="size-3" />
                            <span>
                                Rolled {event.rolls?.length || 0} time
                                {(event.rolls?.length || 0) !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Calendar className="size-3" />
                    <span>
                        Created {format(new Date(event.created), "MMM d, yyyy")}
                    </span>
                </div>
                {event.updated && event.updated !== event.created && (
                    <span>
                        Updated {format(new Date(event.updated), "MMM d, yyyy")}
                    </span>
                )}
            </CardFooter>
        </Card>
    );
}
