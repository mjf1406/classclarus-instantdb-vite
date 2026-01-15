import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/classes/_classesLayout/members/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/classes/_classesLayout/members/"!</div>
}
