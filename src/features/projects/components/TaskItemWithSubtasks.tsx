import { useState } from 'react';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import type { ProjectTask, UpdateTaskInput } from '../types/task.types';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';

interface TaskItemWithSubtasksProps {
  task: ProjectTask;
  projectId: string;
  onUpdate: (id: string, updates: UpdateTaskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask: (parentId: string, task: Partial<ProjectTask>) => Promise<void>;
  teamMembers?: { id: string; name: string }[];
  depth?: number; // Current depth level for styling
}

/**
 * Recursive Task Item Component with Subtasks
 * Displays a task and all its nested subtasks with visual hierarchy
 */
export function TaskItemWithSubtasks({
  task,
  projectId,
  onUpdate,
  onDelete,
  onAddSubtask,
  teamMembers = [],
  depth = 0,
}: TaskItemWithSubtasksProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const canAddSubtask = task.depth_level < 2; // Solo hasta nivel 2

  const indentClass = depth === 0 ? '' : depth === 1 ? 'ml-8' : 'ml-16';

  const handleAddSubtask = async (subtaskData: Partial<ProjectTask>) => {
    await onAddSubtask(task.id, subtaskData);
    setIsAddingSubtask(false);
  };

  return (
    <div className={`${indentClass}`}>
      {/* Task Item with Expand/Collapse */}
      <div className="flex items-start gap-2 group">
        {/* Expand/Collapse Button */}
        {hasSubtasks && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 p-1 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? 'Colapsar subtareas' : 'Expandir subtareas'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}

        {/* Spacer if no subtasks */}
        {!hasSubtasks && canAddSubtask && (
          <div className="w-6" /> // Space for alignment
        )}

        {/* Task Item */}
        <div className="flex-1">
          <TaskItem
            task={task}
            onUpdate={(updates) => onUpdate(task.id, updates)}
            onDelete={() => onDelete(task.id)}
            teamMembers={teamMembers}
          />

          {/* Add Subtask Button */}
          {canAddSubtask && (
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="mt-2 ml-10 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="w-3 h-3" />
              Agregar subtarea
            </button>
          )}
        </div>
      </div>

      {/* Subtask Form */}
      {isAddingSubtask && (
        <div className="ml-10 mt-2 mb-4">
          <TaskForm
            projectId={projectId}
            onSubmit={handleAddSubtask}
            onCancel={() => setIsAddingSubtask(false)}
            teamMembers={teamMembers}
          />
        </div>
      )}

      {/* Render Subtasks Recursively */}
      {hasSubtasks && isExpanded && (
        <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-2">
          {task.subtasks!.map((subtask) => (
            <TaskItemWithSubtasks
              key={subtask.id}
              task={subtask}
              projectId={projectId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              teamMembers={teamMembers}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
