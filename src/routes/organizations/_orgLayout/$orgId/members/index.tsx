import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organizations/_orgLayout/$orgId/members/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/organizations/members"!</div>
}
