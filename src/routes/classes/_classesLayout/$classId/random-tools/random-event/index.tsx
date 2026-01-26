import { createFileRoute, useParams } from '@tanstack/react-router'
import { RestrictedRoute } from '@/components/auth/restricted-route'
import { useClassById } from '@/hooks/use-class-hooks'
import { useClassRole } from '@/hooks/use-class-role'
import { Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/db'
import { EventsGrid } from './-components/events-grid'
import { CreateEventDialog } from './-components/create-event-dialog'
import { RollEventButton } from './-components/roll-event-button'
import { ImportDefaultEventsButton } from './-components/import-default-events-button'
import { EventStatisticsTable } from './-components/event-statistics-table'
import defaultEvents from '@/lib/defaults/default_random_events.json'
import type { InstaQLEntity } from '@instantdb/react'
import type { AppSchema } from '@/instant.schema'

export const Route = createFileRoute(
  '/classes/_classesLayout/$classId/random-tools/random-event/',
)({
  component: RouteComponent,
})

type EventEntity = InstaQLEntity<
  AppSchema,
  'random_events',
  { class?: {}; rolls?: {} }
>

type EventsQueryResult = {
  random_events?: EventEntity[]
}

function RouteComponent() {
  const params = useParams({ strict: false })
  const classId = params.classId
  const { class: classEntity, isLoading } = useClassById(classId)
  const roleInfo = useClassRole(classEntity)

  const eventsQuery = classId
    ? {
        random_events: {
          $: { where: { 'class.id': classId } },
          class: {},
          rolls: {},
        },
      }
    : null

  const { data, isLoading: eventsLoading } = db.useQuery(eventsQuery)

  const typedEvents = (data as EventsQueryResult | undefined) ?? null
  const events = typedEvents?.random_events || []

  const canManage =
    roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher

  // Check if all default events have been imported
  const existingEventNames = events.map((e) => e.name)
  const hasAllDefaultEvents =
    existingEventNames.length > 0 &&
    defaultEvents.every((event) => existingEventNames.includes(event.name))

  return (
    <RestrictedRoute
      role={roleInfo.role}
      isLoading={isLoading}
      backUrl={classId ? `/classes/${classId}` : '/classes'}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="size-12 md:size-16 text-primary" />
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                Random Event
              </h1>
              <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                View and manage random events for your class
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <RollEventButton
                  events={events}
                  classId={classId ?? ''}
                  canManage={canManage}
                />
                {!hasAllDefaultEvents && (
                  <ImportDefaultEventsButton
                    classId={classId ?? ''}
                    existingEventNames={existingEventNames}
                  />
                )}
                <CreateEventDialog classId={classId ?? ''}>
                  <Button size="lg">
                    <Plus className="size-4 mr-2" />
                    <span className="hidden md:inline">Create Event</span>
                    <span className="md:hidden">Create</span>
                  </Button>
                </CreateEventDialog>
              </>
            )}
          </div>
        </div>
        {!eventsLoading && events.length > 0 && (
          <EventStatisticsTable events={events} />
        )}
        <div className="w-full">
          <EventsGrid
            events={events}
            classId={classId ?? ''}
            isLoading={eventsLoading}
            canManage={canManage}
          />
        </div>
      </div>
    </RestrictedRoute>
  )
}
