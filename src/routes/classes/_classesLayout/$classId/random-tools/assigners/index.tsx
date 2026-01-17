import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { UnderConstruction } from '@/components/under-construction'
import { LayoutGrid, Shuffle, RotateCw, Users, Scale, AlertTriangle } from 'lucide-react'
import { RestrictedRoute } from '@/components/auth/restricted-route'
import { useClassById } from '@/hooks/use-class-hooks'
import { useClassRole } from '@/hooks/use-class-role'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

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
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="fair-play" className="gap-2">
              <Scale className="size-4" />
              Fair Play
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seats" className="mt-4">
            <div className="space-y-4">
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
          </TabsContent>

          <TabsContent value="random" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Random</h3>
                <p className="text-muted-foreground">
                  Generate truly random assignments using a proven shuffling algorithm. Perfect for distributing 
                  resources that are the same for everyone, but still require tracking for each student, like Chromebooks, tablets, etc.
                </p>
              </div>
              <UnderConstruction />
            </div>
          </TabsContent>

          <TabsContent value="rotating" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Rotating</h3>
                <p className="text-muted-foreground">
                  Create predictable, rotating assignments that move students through a sequence. Choose to rotate 
                  right (moving the last person to the front) or left (moving the first person to the back) for 
                  consistent, fair rotation patterns.
                </p>
              </div>
              <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
                <AlertTriangle className="size-4" />
                <AlertTitle className="text-yellow-900 dark:text-yellow-200">Important</AlertTitle>
                <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                  This does not work if groups/teams are changed frequently as it does not ensure everyone gets a turn fairly. If you change groups/teams frequently, use Fair Play instead.
                </AlertDescription>
              </Alert>
              <UnderConstruction />
            </div>
          </TabsContent>

          <TabsContent value="fair-play" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Fair Play</h3>
                <p className="text-muted-foreground">
                  Assign jobs and tasks fairly by balancing experience across all students. Students with the least 
                  overall experience get priority, and then the system ensures everyone gets a chance at jobs they've 
                  done the fewest times. Works separately for boys and girls to maintain balanced participation.
                </p>
              </div>
              <UnderConstruction />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RestrictedRoute>
  )
}
