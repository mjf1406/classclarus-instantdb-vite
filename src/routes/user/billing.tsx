import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/user/billing')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/user/billing"!</div>
}
