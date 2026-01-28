import React, { useState } from 'react';
import type { ProjectTask, UpdateTaskInput, TaskStatus, TaskPriority } from '../types/task.types';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_COLORS,
} from '../types/task.types';
import { ChevronRight, ChevronDown, Plus, Trash2, Calendar, User, CheckCircle2, Circle } from 'lucide-react';
import { TaskForm } from './TaskForm';

interface TaskTableViewProps {
  projectId: string;
  tasks: ProjectTask[];
  onUpdateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddTask: (task: Partial<ProjectTask>) => Promise<void>;
  teamMembers?: { id: string; name: string }[];
}

/**
 * Task Table View Component
 * Renders a hierarchical table of tasks and subtasks
 */
export function TaskTableView({
  projectId,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  teamMembers = [],
}: TaskTableViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleToggleDone = async (task: ProjectTask) => {
    const isDone = task.status === 'done';
    await onUpdateTask(task.id, {
      status: isDone ? 'todo' : 'done',
    });
  };

  const renderTaskRow = (task: ProjectTask, depth: number = 0) => {
    const isExpanded = expandedTasks[task.id] !== false; // Default to expanded
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isDone = task.status === 'done';
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;

    return (
      <React.Fragment key={task.id}>
        <tr className={`group hover:bg-gray-50 transition-colors border-b border-gray-100 ${isDone ? 'opacity-60' : ''}`}>
          {/* Title column with hierarchy */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.5}rem` }}>
              <button
                onClick={() => handleToggleDone(task)}
                className={`flex-shrink-0 transition-colors ${isDone ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
              
              {hasSubtasks ? (
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-400 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-6" />
              )}
              
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </span>
                {task.description && (
                  <span className="text-xs text-gray-500 truncate mt-0.5">
                    {task.description}
                  </span>
                )}
              </div>
            </div>
          </td>

          {/* Status */}
          <td className="px-4 py-3">
            <select
              value={task.status}
              onChange={(e) => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border cursor-pointer focus:ring-0 ${TASK_STATUS_COLORS[task.status]}`}
            >
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </td>

          {/* Priority */}
          <td className="px-4 py-3">
            <select
              value={task.priority}
              onChange={(e) => onUpdateTask(task.id, { priority: e.target.value as TaskPriority })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-white cursor-pointer focus:ring-0 ${TASK_PRIORITY_COLORS[task.priority]}`}
            >
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {TASK_PRIORITY_ICONS[value as TaskPriority]} {label}
                </option>
              ))}
            </select>
          </td>

          {/* Assignee */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <select
                value={task.assigned_to || ''}
                onChange={(e) => onUpdateTask(task.id, { assigned_to: e.target.value || null })}
                className="text-xs text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0"
              >
                <option value="">Sin asignar</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </td>

          {/* Due Date */}
          <td className="px-4 py-3">
            <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
              <Calendar className="w-3.5 h-3.5" />
              {task.due_date ? 
                new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) 
                : '--'}
            </div>
          </td>

          {/* Actions */}
          <td className="px-4 py-3 text-right">
            <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {depth < 2 && (
                <button
                  onClick={() => setAddingSubtaskTo(task.id)}
                  title="Agregar subtarea"
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDeleteTask(task.id)}
                title="Eliminar"
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Nested Subtask Form */}
        {addingSubtaskTo === task.id && (
          <tr>
            <td colSpan={6} className="px-4 py-2 bg-blue-50/50">
              <div className="mx-auto max-w-2xl">
                <TaskForm
                  projectId={projectId}
                  onSubmit={async (data) => {
                    await onAddTask({ ...data, parent_task_id: task.id });
                    setAddingSubtaskTo(null);
                  }}
                  onCancel={() => setAddingSubtaskTo(null)}
                  teamMembers={teamMembers}
                />
              </div>
            </td>
          </tr>
        )}

        {/* Render children */}
        {hasSubtasks && isExpanded && (
          task.subtasks!.map(subtask => renderTaskRow(subtask, depth + 1))
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6">Tarea</th>
              <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Estado</th>
              <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Prioridad</th>
              <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Asignado</th>
              <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Entrega</th>
              <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tasks.filter(t => !t.parent_task_id).map(task => renderTaskRow(task))}
          </tbody>
        </table>
        
        {tasks.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <p className="text-sm font-medium">No hay tareas en este proyecto</p>
          </div>
        )}
      </div>
    </div>
  );
}
