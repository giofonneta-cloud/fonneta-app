'use client';

import { DashboardSidebar } from '@/shared/components/DashboardSidebar'
import { NotificationBell } from '@/shared/components/connections/NotificationBell'
import { useSidebarStore } from '@/features/layout/store/sidebarStore'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DashboardSidebar />
      <main className={`min-h-screen transition-all duration-300 ${isCollapsed ? 'pl-20' : 'pl-64'}`}>
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
