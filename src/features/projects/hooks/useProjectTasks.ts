import { useState, useEffect, useCallback } from 'react';
import { taskService, commentService } from '../services/taskService';
import type { ProjectTask, TaskStats, CreateTaskInput, UpdateTaskInput, ProjectComment, CreateCommentInput } from '../types/task.types';

interface UseProjectTasksReturn {
  // Tasks
  tasks: ProjectTask[];
  stats: TaskStats | null;
  loading: boolean;
  error: string | null;

  // Task actions
  addTask: (task: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  refreshTasks: () => Promise<void>;

  // Comments
  comments: ProjectComment[];
  commentsLoading: boolean;
  commentsError: string | null;

  // Comment actions
  addComment: (comment: string) => Promise<void>;
  updateComment: (id: string, comment: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  refreshComments: () => Promise<void>;
}

/**
 * Hook for managing project tasks and comments
 * Provides CRUD operations and real-time state management
 */
export function useProjectTasks(projectId: string | null): UseProjectTasksReturn {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [tasksData, statsData] = await Promise.all([
        taskService.getTasksByProject(projectId),
        taskService.getTaskStats(projectId),
      ]);

      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!projectId) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    try {
      setCommentsLoading(true);
      setCommentsError(null);

      const commentsData = await commentService.getCommentsByProject(projectId);
      setComments(commentsData);
    } catch (err) {
      console.error('Error loading comments:', err);
      setCommentsError(err instanceof Error ? err.message : 'Error al cargar comentarios');
    } finally {
      setCommentsLoading(false);
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    loadTasks();
    loadComments();
  }, [loadTasks, loadComments]);

  // Task operations
  const addTask = useCallback(async (task: CreateTaskInput) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      await taskService.createTask({
        ...task,
        project_id: projectId,
      });
      await loadTasks(); // Refresh after create
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  }, [projectId, loadTasks]);

  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput) => {
    try {
      await taskService.updateTask(id, updates);
      await loadTasks(); // Refresh after update
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  }, [loadTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await taskService.deleteTask(id);
      await loadTasks(); // Refresh after delete
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  }, [loadTasks]);

  const reorderTasks = useCallback(async (taskIds: string[]) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      // Optimistically update UI
      const reorderedTasks = taskIds.map((id, index) => {
        const task = tasks.find((t) => t.id === id);
        return task ? { ...task, order_index: index } : null;
      }).filter(Boolean) as ProjectTask[];

      setTasks(reorderedTasks);

      // Persist to backend
      await taskService.reorderTasks(projectId, taskIds);
    } catch (err) {
      console.error('Error reordering tasks:', err);
      // Revert on error
      await loadTasks();
      throw err;
    }
  }, [projectId, tasks, loadTasks]);

  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  // Comment operations
  const addComment = useCallback(async (comment: string) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      await commentService.createComment({
        project_id: projectId,
        comment,
        user_id: '', // Will be set by service from auth context
      });
      await loadComments(); // Refresh after create
    } catch (err) {
      console.error('Error creating comment:', err);
      throw err;
    }
  }, [projectId, loadComments]);

  const updateComment = useCallback(async (id: string, comment: string) => {
    try {
      await commentService.updateComment(id, comment);
      await loadComments(); // Refresh after update
    } catch (err) {
      console.error('Error updating comment:', err);
      throw err;
    }
  }, [loadComments]);

  const deleteComment = useCallback(async (id: string) => {
    try {
      await commentService.deleteComment(id);
      await loadComments(); // Refresh after delete
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }, [loadComments]);

  const refreshComments = useCallback(async () => {
    await loadComments();
  }, [loadComments]);

  return {
    // Tasks
    tasks,
    stats,
    loading,
    error,

    // Task actions
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refreshTasks,

    // Comments
    comments,
    commentsLoading,
    commentsError,

    // Comment actions
    addComment,
    updateComment,
    deleteComment,
    refreshComments,
  };
}
