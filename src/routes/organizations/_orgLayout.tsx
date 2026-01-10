import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organizations/_orgLayout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_organizationsLayouts"!</div>
}
