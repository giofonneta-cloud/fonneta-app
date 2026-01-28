import { useState } from 'react';
import type { ProjectTask } from '../types/task.types';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_COLORS,
} from '../types/task.types';

interface TaskItemProps {
  task: ProjectTask;
  onUpdate: (updates: Partial<ProjectTask>) => Promise<void>;
  onDelete: () => Promise<void>;
  teamMembers?: { id: string; name: string }[];
}

/**
 * Task Item Component
 * Individual task row with inline editing capabilities
 * Supports checkbox toggle, status change, priority, assignment, and due date
 */
export function TaskItem({ task, onUpdate, onDelete, teamMembers = [] }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [loading, setLoading] = useState(false);

  const isDone = task.status === 'done';
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;

  const handleToggleDone = async () => {
    setLoading(true);
    try {
      await onUpdate({
        status: isDone ? 'todo' : 'done',
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() === '' || editedTitle === task.title) {
      setIsEditing(false);
      setEditedTitle(task.title);
      return;
    }

    setLoading(true);
    try {
      await onUpdate({ title: editedTitle.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task title:', error);
      setEditedTitle(task.title);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: ProjectTask['status']) => {
    setLoading(true);
    try {
      await onUpdate({ status });
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (priority: ProjectTask['priority']) => {
    setLoading(true);
    try {
      await onUpdate({ priority });
    } catch (error) {
      console.error('Error updating task priority:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeChange = async (assigned_to: string | undefined) => {
    setLoading(true);
    try {
      await onUpdate({ assigned_to: assigned_to || null });
    } catch (error) {
      console.error('Error updating task assignee:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
        isDone
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : isOverdue
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleDone}
        disabled={loading}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
          isDone
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {isDone && (
          <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditedTitle(task.title);
              }
            }}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            className={`text-left w-full text-sm font-medium transition-colors ${
              isDone
                ? 'text-gray-500 line-through'
                : 'text-gray-900 hover:text-blue-600'
            }`}
          >
            {task.title}
          </button>
        )}

        {/* Description */}
        {task.description && (
          <p className={`text-xs ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.description}
          </p>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Badge */}
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as ProjectTask['status'])}
            disabled={loading}
            className={`px-2 py-1 rounded border text-xs font-medium cursor-pointer ${TASK_STATUS_COLORS[task.status]}`}
          >
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={task.priority}
            onChange={(e) => handlePriorityChange(e.target.value as ProjectTask['priority'])}
            disabled={loading}
            className={`px-2 py-1 rounded border border-gray-200 bg-white text-xs font-medium cursor-pointer ${TASK_PRIORITY_COLORS[task.priority]}`}
          >
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {TASK_PRIORITY_ICONS[value as ProjectTask['priority']]} {label}
              </option>
            ))}
          </select>

          {/* Assignee */}
          {teamMembers.length > 0 && (
            <select
              value={task.assigned_to || ''}
              onChange={(e) => handleAssigneeChange(e.target.value || undefined)}
              disabled={loading}
              className="px-2 py-1 rounded border border-gray-200 bg-white text-xs cursor-pointer"
            >
              <option value="">Sin asignar</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}

          {/* Due Date */}
          {task.due_date && (
            <span
              className={`px-2 py-1 rounded border ${
                isOverdue
                  ? 'bg-red-100 text-red-700 border-red-300 font-medium'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              📅 {new Date(task.due_date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <button
        onClick={onDelete}
        disabled={loading}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-all"
        title="Eliminar tarea"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
