import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import type {
  ProjectTask,
  TaskStats,
  CreateTaskInput,
  UpdateTaskInput,
  ProjectComment,
  CreateCommentInput,
  TaskStatus
} from '../types/task.types';
import { UpdateTaskStatusSchema, validateOrThrow } from '@/shared/lib/validators';

/**
 * Helper: Build hierarchical task tree from flat list
 */
function buildTaskTree(tasks: ProjectTask[]): ProjectTask[] {
  const taskMap = new Map<string, ProjectTask>();
  const rootTasks: ProjectTask[] = [];

  // First pass: create map and initialize subtasks array
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, subtasks: [] });
  });

  // Second pass: build tree structure
  tasks.forEach(task => {
    const currentTask = taskMap.get(task.id)!;
    if (task.parent_task_id) {
      const parentTask = taskMap.get(task.parent_task_id);
      if (parentTask) {
        parentTask.subtasks!.push(currentTask);
        parentTask.subtask_count = (parentTask.subtask_count || 0) + 1;
      }
    } else {
      rootTasks.push(currentTask);
    }
  });

  return rootTasks;
}

/**
 * Task Service
 * Handles all CRUD operations for project tasks
 */
export const taskService = {
  /**
   * Get all tasks for a specific project (hierarchical)
   */
  getTasksByProject: async (projectId: string): Promise<ProjectTask[]> => {
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('depth_level', { ascending: true })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    const tasks = (data || []).map((task: any) => ({
      ...task,
      assigned_to_name: 'Sin asignar',
      depth_level: task.depth_level || 0,
    }));

    // Build hierarchical tree
    return buildTaskTree(tasks);
  },

  /**
   * Create a new task
   */
  createTask: async (task: CreateTaskInput): Promise<ProjectTask> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ Error: Intento de crear tarea sin usuario autenticado');
      throw new Error('Debes iniciar sesión para crear tareas');
    }

    console.log('📝 Creando tarea con payload:', { ...task, created_by: user.id });

    const { data, error } = await supabase
      .from('project_tasks')
      .insert({
        ...task,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase al crear tarea:', error);
      throw error;
    }
    return data;
  },

  /**
   * Update an existing task
   */
  updateTask: async (id: string, updates: UpdateTaskInput): Promise<ProjectTask> => {
    // If marking as done, set completed_at
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    // If changing from done to another status, clear completed_at
    if (updates.status && updates.status !== 'done') {
      updates.completed_at = undefined;
    }

    const { data, error } = await supabase
      .from('project_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update task status using RPC function
   * Automatically handles completed_at timestamp
   * Usa: update_task_status RPC function
   */
  updateTaskStatus: async (taskId: string, newStatus: TaskStatus): Promise<{
    success: boolean;
    task_id: string;
    old_status: string;
    new_status: string;
    completed_at: string | null;
  }> => {
    // Validar con Zod
    validateOrThrow(UpdateTaskStatusSchema, { task_id: taskId, new_status: newStatus });

    const { data, error } = await supabase.rpc('update_task_status', {
      p_task_id: taskId,
      p_new_status: newStatus,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Reorder tasks within a project
   * Updates the order_index for multiple tasks at once
   */
  reorderTasks: async (projectId: string, taskIds: string[]): Promise<void> => {
    // Update each task with its new order_index
    const updates = taskIds.map((taskId, index) => ({
      id: taskId,
      order_index: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('project_tasks')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('project_id', projectId); // Security: ensure task belongs to project

      if (error) throw error;
    }
  },

  /**
   * Get task statistics for a project
   * Returns counts by status and overdue tasks
   */
  getTaskStats: async (projectId: string): Promise<TaskStats> => {
    const { data, error } = await supabase
      .from('project_tasks')
      .select('status, due_date')
      .eq('project_id', projectId);

    if (error) throw error;

    const tasks = data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats: TaskStats = {
      total: tasks.length,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
      overdue: 0,
    };

    tasks.forEach((task: any) => {
      // Count by status
      if (task.status === 'todo') stats.todo++;
      else if (task.status === 'in_progress') stats.in_progress++;
      else if (task.status === 'review') stats.review++;
      else if (task.status === 'done') stats.done++;

      // Count overdue (not done and due_date < today)
      if (task.status !== 'done' && task.due_date) {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          stats.overdue++;
        }
      }
    });

    return stats;
  },

  /**
   * Get tasks that are overdue (not done and past due_date)
   */
  getOverdueTasks: async (projectId: string): Promise<ProjectTask[]> => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .neq('status', 'done')
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((task: any) => ({
      ...task,
      assigned_to_name: 'Sin asignar',
    }));
  },
};

/**
 * Comment Service
 * Handles all CRUD operations for project comments
 */
export const commentService = {
  /**
   * Get all comments for a specific project
   */
  getCommentsByProject: async (projectId: string): Promise<ProjectComment[]> => {
    const { data, error } = await supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((comment: any) => ({
      ...comment,
      user_name: 'Usuario', // Placeholder for now
    }));
  },

  /**
   * Create a new comment
   */
  createComment: async (comment: CreateCommentInput): Promise<ProjectComment> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Debes iniciar sesión para comentar');
    }

    const { data, error } = await supabase
      .from('project_comments')
      .insert({
        ...comment,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase al crear comentario:', error);
      throw error;
    }
    return data;
  },

  /**
   * Update a comment (only the comment text)
   */
  updateComment: async (id: string, comment: string): Promise<ProjectComment> => {
    const { data, error } = await supabase
      .from('project_comments')
      .update({ comment })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a comment
   */
  deleteComment: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
