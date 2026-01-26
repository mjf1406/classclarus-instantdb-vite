import { useState } from 'react'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { RestrictedRoute } from '@/components/auth/restricted-route'
import { useClassById } from '@/hooks/use-class-hooks'
import { useClassRole } from '@/hooks/use-class-role'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dice6, Shuffle, Hand } from 'lucide-react'
import { ShufflerTabContent } from './-components/shuffler-tab-content'
import { PickerTabContent } from './-components/picker-tab-content'

export const Route = createFileRoute(
  '/classes/_classesLayout/$classId/random-tools/randomizer/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ strict: false })
  const classId = params.classId
  const { class: classEntity, isLoading } = useClassById(classId)
  const roleInfo = useClassRole(classEntity)
  const [activeTab, setActiveTab] = useState<string>('shuffler')

  return (
    <RestrictedRoute
      role={roleInfo.role}
      isLoading={isLoading}
      backUrl={classId ? `/classes/${classId}` : '/classes'}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dice6 className="size-12 md:size-16 text-primary" />
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                Randomizer
              </h1>
              <p className="text-sm md:text-base lg:text-base text-muted-foreground mt-1">
                View and manage randomizer for your class
              </p>
            </div>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shuffler" className="gap-2">
              <Shuffle className="size-4" />
              Shuffler
            </TabsTrigger>
            <TabsTrigger value="picker" className="gap-2">
              <Hand className="size-4" />
              Picker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shuffler" className="mt-4">
            {classId && <ShufflerTabContent classId={classId} />}
          </TabsContent>

          <TabsContent value="picker" className="mt-4">
            {classId && <PickerTabContent classId={classId} />}
          </TabsContent>
        </Tabs>
      </div>
    </RestrictedRoute>
  )
}
