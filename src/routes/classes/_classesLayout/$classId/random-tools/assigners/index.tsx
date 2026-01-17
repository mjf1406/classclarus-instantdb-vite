import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UnderConstruction } from '@/components/under-construction'
import { LayoutGrid, Shuffle, RotateCw, Users } from 'lucide-react'
import { RestrictedRoute } from '@/components/auth/restricted-route'
import { useClassById } from '@/hooks/use-class-hooks'
import { useClassRole } from '@/hooks/use-class-role'

export const Route = createFileRoute(
  '/classes/_classesLayout/$classId/random-tools/assigners/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ strict: false })
  const classId = params.classId
  const { class: classEntity, isLoading } = useClassById(classId)
  const roleInfo = useClassRole(classEntity)
  const [activeTab, setActiveTab] = useState<string>('seats')

  return (
    <RestrictedRoute
      role={roleInfo.role}
      isLoading={isLoading}
      backUrl={classId ? `/classes/${classId}` : '/classes'}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-12 md:size-16 text-primary" />
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                Assigners
              </h1>
              <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                View and manage assigners for your class
              </p>
            </div>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="seats" className="gap-2">
              <LayoutGrid className="size-4" />
              Seats
            </TabsTrigger>
            <TabsTrigger value="random" className="gap-2">
              <Shuffle className="size-4" />
              Random
            </TabsTrigger>
            <TabsTrigger value="rotating" className="gap-2">
              <RotateCw className="size-4" />
              Rotating
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seats" className="mt-4">
            <UnderConstruction />
          </TabsContent>

          <TabsContent value="random" className="mt-4">
            <UnderConstruction />
          </TabsContent>

          <TabsContent value="rotating" className="mt-4">
            <UnderConstruction />
          </TabsContent>
        </Tabs>
      </div>
    </RestrictedRoute>
  )
}
