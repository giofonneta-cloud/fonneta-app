import { ProviderSidebar } from '@/features/providers/components/ProviderSidebar'
import { NotificationBell } from '@/shared/components/connections/NotificationBell'

export default function ProvidersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <ProviderSidebar />
      <main className="pl-64 min-h-screen">
        <div className="p-8 max-w-[1600px] mx-auto">
          <header className="mb-8 flex justify-end">
             <div className="flex items-center gap-4">
                <NotificationBell />
             </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  )
}
