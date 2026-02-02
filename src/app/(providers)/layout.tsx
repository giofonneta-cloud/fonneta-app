import { ProviderSidebar } from '@/features/providers/components/ProviderSidebar'

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
          {children}
        </div>
      </main>
    </div>
  )
}
