'use client';

import { DashboardSidebar } from '@/shared/components/DashboardSidebar'
import { ProviderSidebar } from '@/features/providers/components/ProviderSidebar'
import { NotificationBell } from '@/shared/components/connections/NotificationBell'
import { useSidebarStore } from '@/features/layout/store/sidebarStore'
import { useAuthStore } from '@/features/auth/store/authStore'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed } = useSidebarStore();
  const { profile } = useAuthStore();
  // Un proveedor que llega a una ruta de /dashboard (ej. Cotizaciones) debe ver
  // su propia navegación, no el menú interno completo de Finanzas/Proyectos/Admin.
  const isProvider = profile?.role === 'proveedor';

  return (
    <div className="min-h-screen bg-gray-50/50">
      {isProvider ? <ProviderSidebar /> : <DashboardSidebar />}
      <main className={`min-h-screen transition-all duration-300 ${isProvider ? 'pl-64' : isCollapsed ? 'pl-20' : 'pl-64'}`}>
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
