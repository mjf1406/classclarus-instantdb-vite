import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { UnderConstruction } from '@/components/under-construction'

export const Route = createFileRoute('/user/_userLayout/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <div className="h-[calc(100vh-12rem)]">
        <UnderConstruction />
      </div>
    </div>
  )
}
