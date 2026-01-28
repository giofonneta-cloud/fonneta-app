import type { TaskStats as TaskStatsType } from '../types/task.types';

interface TaskStatsProps {
  stats: TaskStatsType;
  compact?: boolean;
}

/**
 * Task Stats Widget
 * Displays task statistics with progress bar and counts
 * Can be used in compact mode for project cards
 */
export function TaskStats({ stats, compact = false }: TaskStatsProps) {
  const progressPercentage = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;
  const hasOverdue = stats.overdue > 0;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercentage === 100
                ? 'bg-green-500'
                : progressPercentage >= 50
                ? 'bg-blue-500'
                : 'bg-gray-400'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {stats.done}/{stats.total} completadas
          </span>

          {hasOverdue && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {stats.overdue} vencidas
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full mode (for detail panel)
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Progreso de Tareas
        </h3>
        <span className="text-2xl font-bold text-gray-900">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            progressPercentage === 100
              ? 'bg-green-500'
              : progressPercentage >= 50
              ? 'bg-blue-500'
              : 'bg-gray-400'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem
          label="Total"
          value={stats.total}
          color="gray"
        />
        <StatItem
          label="Completadas"
          value={stats.done}
          color="green"
        />
        <StatItem
          label="En Progreso"
          value={stats.in_progress}
          color="blue"
        />
        <StatItem
          label="Por Hacer"
          value={stats.todo}
          color="gray"
        />
        <StatItem
          label="En Revisión"
          value={stats.review}
          color="yellow"
        />
        {hasOverdue && (
          <StatItem
            label="Vencidas"
            value={stats.overdue}
            color="red"
            highlight
          />
        )}
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  color: 'gray' | 'green' | 'blue' | 'yellow' | 'red';
  highlight?: boolean;
}

function StatItem({ label, value, color, highlight }: StatItemProps) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div
      className={`rounded-lg p-3 ${colorClasses[color]} ${
        highlight ? 'ring-2 ring-red-500 ring-offset-1' : ''
      }`}
    >
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
