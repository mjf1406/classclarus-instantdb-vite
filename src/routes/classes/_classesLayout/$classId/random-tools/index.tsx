import { createFileRoute, useParams } from '@tanstack/react-router'
import { RestrictedRoute } from '@/components/auth/restricted-route'
import { useClassById } from '@/hooks/use-class-hooks'
import { useClassRole } from '@/hooks/use-class-role'

export const Route = createFileRoute(
  '/classes/_classesLayout/$classId/random-tools/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ strict: false })
  const classId = params.classId
  const { class: classEntity, isLoading } = useClassById(classId)
  const roleInfo = useClassRole(classEntity)

  return (
    <RestrictedRoute
      role={roleInfo.role}
      isLoading={isLoading}
      backUrl={classId ? `/classes/${classId}` : '/classes'}
    >
      <div>Hello "/classes/_classesLayout/$classId/random-tools/"!</div>
    </RestrictedRoute>
  )
}
