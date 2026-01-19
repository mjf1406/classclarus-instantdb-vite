import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UnderConstruction } from '@/components/under-construction'
import { LayoutGrid, Shuffle, RotateCw, Users, Scale, Plus } from 'lucide-react'
import { RestrictedRoute } from '@/components/auth/restricted-route'
import { useClassById } from '@/hooks/use-class-hooks'
import { useClassRole } from '@/hooks/use-class-role'
import { RandomTabContent } from './-components/random/random-tab-content'
import { RotatingTabContent } from './-components/rotating/rotating-tab-content'
import { EquitableTabContent } from './-components/equitable/equitable-tab-content'
import { Button } from '@/components/ui/button'
import { CreateAssignerDialog as CreateRandomAssignerDialog } from './-components/random/create-assigner-dialog'
import { CreateAssignerDialog as CreateRotatingAssignerDialog } from './-components/rotating/create-assigner-dialog'
import { CreateAssignerDialog as CreateEquitableAssignerDialog } from './-components/equitable/create-assigner-dialog'

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
          {activeTab === 'random' && (roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher) && (
            <CreateRandomAssignerDialog classId={classId ?? ''}>
              <Button size="lg">
                <Plus className="size-4" />
                <span className="sr-only">Create Random Assigner</span>
                <span className="hidden md:block">
                  Create Random Assigner
                </span>
              </Button>
            </CreateRandomAssignerDialog>
          )}
          {activeTab === 'rotating' && (roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher) && (
            <CreateRotatingAssignerDialog classId={classId ?? ''}>
              <Button size="lg">
                <Plus className="size-4" />
                <span className="sr-only">Create Rotating Assigner</span>
                <span className="hidden md:block">
                  Create Rotating Assigner
                </span>
              </Button>
            </CreateRotatingAssignerDialog>
          )}
          {activeTab === 'equitable' && (roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher) && (
            <CreateEquitableAssignerDialog classId={classId ?? ''}>
              <Button size="lg">
                <Plus className="size-4" />
                <span className="sr-only">Create Equitable Assigner</span>
                <span className="hidden md:block">
                  Create Equitable Assigner
                </span>
              </Button>
            </CreateEquitableAssignerDialog>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="seats" className="gap-2">
              <LayoutGrid className="size-4" />
              <span className="hidden md:block">Seats</span>
            </TabsTrigger>
            <TabsTrigger value="random" className="gap-2">
              <Shuffle className="size-4" />
              <span className="hidden md:block">Random</span>
            </TabsTrigger>
            <TabsTrigger value="rotating" className="gap-2">
              <RotateCw className="size-4" />
              <span className="hidden md:block">Rotating</span>
            </TabsTrigger>
            <TabsTrigger value="equitable" className="gap-2">
              <Scale className="size-4" />
              <span className="hidden md:block">Equitable</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seats" className="mt-4">
            <div className="w-full flex flex-col items-center justify-center">
            <div className="space-y-4 w-full max-w-2xl">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Seats</h3>
                <p className="text-muted-foreground">
                  Create a visual seat map for your classroom and assign students to seats with smart balancing. 
                  The system ensures students sit with different neighbors and rotate through teams fairly. 
                  You can set custom constraints like seating preferences, separation rules, and team restrictions.
                </p>
              </div>
              <UnderConstruction />
            </div>
            </div>
          </TabsContent>

          <TabsContent value="random" className="mt-4">
            <RandomTabContent
              classId={classId ?? ''}
              canManage={roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher}
            />
          </TabsContent>

          <TabsContent value="rotating" className="mt-4">
            <RotatingTabContent
              classId={classId ?? ''}
              canManage={roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher}
            />
          </TabsContent>

          <TabsContent value="equitable" className="mt-4">
            <EquitableTabContent
              classId={classId ?? ''}
              canManage={roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RestrictedRoute>
  )
}
