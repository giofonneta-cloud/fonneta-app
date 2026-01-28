// Task types for project management system
// Inspired by ClickUp task management

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string | null;
  assigned_to_name?: string | null; // Populated via JOIN with auth.users
  due_date?: string | null; // ISO date format
  completed_at?: string | null; // ISO timestamp
  order_index: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Jerarquía de subtareas (3 niveles: 0, 1, 2)
  parent_task_id?: string | null;
  depth_level: number; // 0 = tarea raíz, 1 = subtarea, 2 = sub-subtarea
  subtasks?: ProjectTask[]; // Subtareas anidadas (calculado en frontend)
  subtask_count?: number; // Cantidad de subtareas directas
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  overdue: number;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  user_name?: string; // Populated via JOIN
  comment: string;
  created_at: string;
  updated_at: string;
}

// Form types for creating/updating tasks
export type CreateTaskInput = Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'assigned_to_name'>;
export type UpdateTaskInput = Partial<Omit<ProjectTask, 'id' | 'project_id' | 'created_at' | 'updated_at'>>;

// Form types for comments
export type CreateCommentInput = Omit<ProjectComment, 'id' | 'created_at' | 'updated_at' | 'user_name'>;
export type UpdateCommentInput = Pick<ProjectComment, 'comment'>;

// UI Constants
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Por Hacer',
  in_progress: 'En Progreso',
  review: 'En Revisión',
  done: 'Completada',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  review: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  done: 'bg-green-100 text-green-700 border-green-300',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export const TASK_PRIORITY_ICONS: Record<TaskPriority, string> = {
  low: '↓',
  medium: '−',
  high: '↑',
  urgent: '⚠️',
};
