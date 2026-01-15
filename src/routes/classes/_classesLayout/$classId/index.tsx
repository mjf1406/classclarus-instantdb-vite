import { createFileRoute } from '@tanstack/react-router'
import { requireAuth, requireClassAccess } from '@/lib/auth-utils'

export const Route = createFileRoute('/classes/_classesLayout/$classId/')({
  beforeLoad: ({ context, location, params }) => {
    requireAuth(context, location);
    requireClassAccess(params.classId, context, location);
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/classes/$classId"!</div>
}
