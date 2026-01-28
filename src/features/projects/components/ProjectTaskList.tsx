import { useState } from 'react';
import { TaskItemWithSubtasks } from './TaskItemWithSubtasks';
import { TaskForm } from './TaskForm';
import { TaskTableView } from './TaskTableView';
import type { ProjectTask } from '../types/task.types';
import { LayoutList, Table as TableIcon, Plus } from 'lucide-react';

interface ProjectTaskListProps {
  projectId: string;
  tasks: ProjectTask[];
  onAddTask: (task: Partial<ProjectTask>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<ProjectTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  teamMembers?: { id: string; name: string }[];
}

/**
 * Project Task List Component with Hierarchical Subtasks
 * Displays all tasks for a project with 3-level hierarchy support
 */
export function ProjectTaskList({
  projectId,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  teamMembers = [],
}: ProjectTaskListProps) {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');

  const handleAddTask = async (taskData: Partial<ProjectTask>) => {
    try {
      await onAddTask(taskData);
      setShowForm(false);
    } catch (error: any) {
      console.error('Error adding task:', error);
      alert(error.message || 'Error al crear la tarea. Por favor intenta de nuevo.');
    }
  };

  const handleAddSubtask = async (parentId: string, subtaskData: Partial<ProjectTask>) => {
    try {
      await onAddTask({
        ...subtaskData,
        parent_task_id: parentId,
      });
    } catch (error: any) {
      console.error('Error adding subtask:', error);
      alert(error.message || 'Error al crear la subtarea. Por favor intenta de nuevo.');
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<ProjectTask>) => {
    try {
      await onUpdateTask(id, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error al actualizar la tarea. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('¿Estás seguro? Esto eliminará la tarea y todas sus subtareas.')) {
      return;
    }

    try {
      await onDeleteTask(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea. Por favor intenta de nuevo.');
    }
  };

  // Group tasks by status (only root tasks)
  const rootTasks = tasks.filter((t) => !t.parent_task_id);
  const groupedTasks = {
    todo: rootTasks.filter((t) => t.status === 'todo'),
    in_progress: rootTasks.filter((t) => t.status === 'in_progress'),
    review: rootTasks.filter((t) => t.status === 'review'),
    done: rootTasks.filter((t) => t.status === 'done'),
  };

  const hasAnyTasks = rootTasks.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tareas ({tasks.length})
          </h3>
          
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-md uppercase tracking-wider ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabla
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-md uppercase tracking-wider ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Cajas
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      {/* Task List */}
      {!hasAnyTasks ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 mb-4">No hay tareas en este proyecto</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Crear la primera tarea
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <TaskTableView
          projectId={projectId}
          tasks={tasks}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
          teamMembers={teamMembers}
        />
      ) : (
        <div className="space-y-6">
          {/* Active Tasks (Not Done) */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Tareas Activas
            </h4>
            {groupedTasks.todo.length === 0 &&
             groupedTasks.in_progress.length === 0 &&
             groupedTasks.review.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No hay tareas activas</p>
            ) : (
              <>
                {groupedTasks.todo.map((task) => (
                  <TaskItemWithSubtasks
                    key={task.id}
                    task={task}
                    projectId={projectId}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    teamMembers={teamMembers}
                  />
                ))}
                {groupedTasks.in_progress.map((task) => (
                  <TaskItemWithSubtasks
                    key={task.id}
                    task={task}
                    projectId={projectId}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    teamMembers={teamMembers}
                  />
                ))}
                {groupedTasks.review.map((task) => (
                  <TaskItemWithSubtasks
                    key={task.id}
                    task={task}
                    projectId={projectId}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    teamMembers={teamMembers}
                  />
                ))}
              </>
            )}
          </div>

          {/* Completed Tasks */}
          {groupedTasks.done.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Completadas ({groupedTasks.done.length})
              </h4>
              {groupedTasks.done.map((task) => (
                <TaskItemWithSubtasks
                  key={task.id}
                  task={task}
                  projectId={projectId}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onAddSubtask={handleAddSubtask}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          projectId={projectId}
          onSubmit={handleAddTask}
          onCancel={() => setShowForm(false)}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}
