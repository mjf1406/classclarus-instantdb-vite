import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState, lazy, Suspense } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UnderConstruction } from '@/components/under-construction'
import { LayoutGrid, Shuffle, RotateCw, Users, Scale, Plus } from 'lucide-react'
import { RestrictedRoute } from '@/components/auth/restricted-route'
import { useClassById } from '@/hooks/use-class-hooks'
import { useClassRole } from '@/hooks/use-class-role'
import { Button } from '@/components/ui/button'

// Lazy load tab content components
const RandomTabContent = lazy(() => import('./-components/random/random-tab-content').then(m => ({ default: m.RandomTabContent })))
const RotatingTabContent = lazy(() => import('./-components/rotating/rotating-tab-content').then(m => ({ default: m.RotatingTabContent })))
const EquitableTabContent = lazy(() => import('./-components/equitable/equitable-tab-content').then(m => ({ default: m.EquitableTabContent })))

// Lazy load dialog components
const CreateRandomAssignerDialog = lazy(() => import('./-components/random/create-assigner-dialog').then(m => ({ default: m.CreateAssignerDialog })))
const CreateRotatingAssignerDialog = lazy(() => import('./-components/rotating/create-assigner-dialog').then(m => ({ default: m.CreateAssignerDialog })))
const CreateEquitableAssignerDialog = lazy(() => import('./-components/equitable/create-assigner-dialog').then(m => ({ default: m.CreateAssignerDialog })))

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
            <Suspense fallback={null}>
              <CreateRandomAssignerDialog classId={classId ?? ''}>
                <Button size="lg">
                  <Plus className="size-4" />
                  <span className="sr-only">Create Random Assigner</span>
                  <span className="hidden md:block">
                    Create Random Assigner
                  </span>
                </Button>
              </CreateRandomAssignerDialog>
            </Suspense>
          )}
          {activeTab === 'rotating' && (roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher) && (
            <Suspense fallback={null}>
              <CreateRotatingAssignerDialog classId={classId ?? ''}>
                <Button size="lg">
                  <Plus className="size-4" />
                  <span className="sr-only">Create Rotating Assigner</span>
                  <span className="hidden md:block">
                    Create Rotating Assigner
                  </span>
                </Button>
              </CreateRotatingAssignerDialog>
            </Suspense>
          )}
          {activeTab === 'equitable' && (roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher) && (
            <Suspense fallback={null}>
              <CreateEquitableAssignerDialog classId={classId ?? ''}>
                <Button size="lg">
                  <Plus className="size-4" />
                  <span className="sr-only">Create Equitable Assigner</span>
                  <span className="hidden md:block">
                    Create Equitable Assigner
                  </span>
                </Button>
              </CreateEquitableAssignerDialog>
            </Suspense>
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
            <Suspense fallback={<div>Loading...</div>}>
              <RandomTabContent
                classId={classId ?? ''}
                canManage={roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="rotating" className="mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <RotatingTabContent
                classId={classId ?? ''}
                canManage={roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="equitable" className="mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <EquitableTabContent
                classId={classId ?? ''}
                canManage={roleInfo.isOwner || roleInfo.isAdmin || roleInfo.isTeacher}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </RestrictedRoute>
  )
}

export const Route = createFileRoute(
  '/classes/_classesLayout/$classId/random-tools/assigners/',
)({
  component: RouteComponent,
})
