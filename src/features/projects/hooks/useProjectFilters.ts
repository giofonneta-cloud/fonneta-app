/**
 * Store Zustand para filtros de proyectos con persistencia localStorage
 * Fase 5 del Plan de Mejoramiento - Filtros persistentes
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProjectFilters, TaskFilters } from '@/shared/lib/validators';

// ============================================
// TYPES
// ============================================

type ProjectStatus = 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type ViewMode = 'grid' | 'list' | 'kanban';
type SortField = 'name' | 'created_at' | 'updated_at' | 'status' | 'end_date';
type SortOrder = 'asc' | 'desc';

interface ProjectFiltersState {
  // Filtros de proyecto
  projectFilters: {
    status: ProjectStatus[];
    pm_id?: string;
    client_id?: string;
    search: string;
    dateFrom?: string;
    dateTo?: string;
  };

  // Filtros de tareas (dentro de un proyecto)
  taskFilters: {
    status: TaskStatus[];
    priority: TaskPriority[];
    assigned_to?: string;
    overdue: boolean;
    search: string;
  };

  // Preferencias de visualización
  viewPreferences: {
    projectViewMode: ViewMode;
    taskViewMode: ViewMode;
    sortField: SortField;
    sortOrder: SortOrder;
    showCompletedTasks: boolean;
    expandedProjects: string[]; // IDs de proyectos expandidos en lista
  };

  // Actions - Filtros de proyecto
  setProjectStatusFilter: (status: ProjectStatus[]) => void;
  setProjectPmFilter: (pmId?: string) => void;
  setProjectClientFilter: (clientId?: string) => void;
  setProjectSearch: (search: string) => void;
  setProjectDateRange: (from?: string, to?: string) => void;
  clearProjectFilters: () => void;

  // Actions - Filtros de tareas
  setTaskStatusFilter: (status: TaskStatus[]) => void;
  setTaskPriorityFilter: (priority: TaskPriority[]) => void;
  setTaskAssignedFilter: (userId?: string) => void;
  setTaskOverdueFilter: (overdue: boolean) => void;
  setTaskSearch: (search: string) => void;
  clearTaskFilters: () => void;

  // Actions - Preferencias de visualización
  setProjectViewMode: (mode: ViewMode) => void;
  setTaskViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  setShowCompletedTasks: (show: boolean) => void;
  toggleProjectExpanded: (projectId: string) => void;

  // Helpers
  hasActiveProjectFilters: () => boolean;
  hasActiveTaskFilters: () => boolean;
  getProjectFiltersForQuery: () => ProjectFilters;
  getTaskFiltersForQuery: () => TaskFilters;
}

// ============================================
// DEFAULT VALUES
// ============================================

const defaultProjectFilters = {
  status: [] as ProjectStatus[],
  pm_id: undefined,
  client_id: undefined,
  search: '',
  dateFrom: undefined,
  dateTo: undefined,
};

const defaultTaskFilters = {
  status: [] as TaskStatus[],
  priority: [] as TaskPriority[],
  assigned_to: undefined,
  overdue: false,
  search: '',
};

const defaultViewPreferences = {
  projectViewMode: 'grid' as ViewMode,
  taskViewMode: 'list' as ViewMode,
  sortField: 'updated_at' as SortField,
  sortOrder: 'desc' as SortOrder,
  showCompletedTasks: true,
  expandedProjects: [] as string[],
};

// ============================================
// STORE
// ============================================

export const useProjectFilters = create<ProjectFiltersState>()(
  persist(
    (set, get) => ({
      // Initial state
      projectFilters: defaultProjectFilters,
      taskFilters: defaultTaskFilters,
      viewPreferences: defaultViewPreferences,

      // Project filter actions
      setProjectStatusFilter: (status) =>
        set((state) => ({
          projectFilters: { ...state.projectFilters, status },
        })),

      setProjectPmFilter: (pm_id) =>
        set((state) => ({
          projectFilters: { ...state.projectFilters, pm_id },
        })),

      setProjectClientFilter: (client_id) =>
        set((state) => ({
          projectFilters: { ...state.projectFilters, client_id },
        })),

      setProjectSearch: (search) =>
        set((state) => ({
          projectFilters: { ...state.projectFilters, search },
        })),

      setProjectDateRange: (dateFrom, dateTo) =>
        set((state) => ({
          projectFilters: { ...state.projectFilters, dateFrom, dateTo },
        })),

      clearProjectFilters: () =>
        set({ projectFilters: defaultProjectFilters }),

      // Task filter actions
      setTaskStatusFilter: (status) =>
        set((state) => ({
          taskFilters: { ...state.taskFilters, status },
        })),

      setTaskPriorityFilter: (priority) =>
        set((state) => ({
          taskFilters: { ...state.taskFilters, priority },
        })),

      setTaskAssignedFilter: (assigned_to) =>
        set((state) => ({
          taskFilters: { ...state.taskFilters, assigned_to },
        })),

      setTaskOverdueFilter: (overdue) =>
        set((state) => ({
          taskFilters: { ...state.taskFilters, overdue },
        })),

      setTaskSearch: (search) =>
        set((state) => ({
          taskFilters: { ...state.taskFilters, search },
        })),

      clearTaskFilters: () =>
        set({ taskFilters: defaultTaskFilters }),

      // View preferences actions
      setProjectViewMode: (projectViewMode) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, projectViewMode },
        })),

      setTaskViewMode: (taskViewMode) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, taskViewMode },
        })),

      setSortField: (sortField) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, sortField },
        })),

      setSortOrder: (sortOrder) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, sortOrder },
        })),

      toggleSortOrder: () =>
        set((state) => ({
          viewPreferences: {
            ...state.viewPreferences,
            sortOrder: state.viewPreferences.sortOrder === 'asc' ? 'desc' : 'asc',
          },
        })),

      setShowCompletedTasks: (showCompletedTasks) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, showCompletedTasks },
        })),

      toggleProjectExpanded: (projectId) =>
        set((state) => {
          const expanded = state.viewPreferences.expandedProjects;
          const isExpanded = expanded.includes(projectId);
          return {
            viewPreferences: {
              ...state.viewPreferences,
              expandedProjects: isExpanded
                ? expanded.filter((id) => id !== projectId)
                : [...expanded, projectId],
            },
          };
        }),

      // Helpers
      hasActiveProjectFilters: () => {
        const { projectFilters } = get();
        return (
          projectFilters.status.length > 0 ||
          !!projectFilters.pm_id ||
          !!projectFilters.client_id ||
          projectFilters.search.length > 0 ||
          !!projectFilters.dateFrom ||
          !!projectFilters.dateTo
        );
      },

      hasActiveTaskFilters: () => {
        const { taskFilters } = get();
        return (
          taskFilters.status.length > 0 ||
          taskFilters.priority.length > 0 ||
          !!taskFilters.assigned_to ||
          taskFilters.overdue ||
          taskFilters.search.length > 0
        );
      },

      getProjectFiltersForQuery: () => {
        const { projectFilters } = get();
        return {
          status: projectFilters.status.length > 0 ? projectFilters.status : undefined,
          pm_id: projectFilters.pm_id,
          client_id: projectFilters.client_id,
          search: projectFilters.search || undefined,
          dateFrom: projectFilters.dateFrom,
          dateTo: projectFilters.dateTo,
        };
      },

      getTaskFiltersForQuery: () => {
        const { taskFilters } = get();
        return {
          status: taskFilters.status.length > 0 ? taskFilters.status : undefined,
          priority: taskFilters.priority.length > 0 ? taskFilters.priority : undefined,
          assigned_to: taskFilters.assigned_to,
          overdue: taskFilters.overdue || undefined,
          search: taskFilters.search || undefined,
        };
      },
    }),
    {
      name: 'fonneta-project-filters',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir preferencias de visualización (no filtros activos)
        viewPreferences: state.viewPreferences,
      }),
    }
  )
);

// ============================================
// SELECTOR HOOKS (para evitar re-renders innecesarios)
// ============================================

export const useProjectViewMode = () =>
  useProjectFilters((state) => state.viewPreferences.projectViewMode);

export const useTaskViewMode = () =>
  useProjectFilters((state) => state.viewPreferences.taskViewMode);

export const useProjectSort = () =>
  useProjectFilters((state) => ({
    field: state.viewPreferences.sortField,
    order: state.viewPreferences.sortOrder,
  }));

export const useShowCompletedTasks = () =>
  useProjectFilters((state) => state.viewPreferences.showCompletedTasks);
