import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    collapseSidebar: () => void;
    expandSidebar: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set) => ({
            isCollapsed: false,
            toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
            collapseSidebar: () => set({ isCollapsed: true }),
            expandSidebar: () => set({ isCollapsed: false }),
        }),
        {
            name: 'sidebar-store',
        }
    )
);
