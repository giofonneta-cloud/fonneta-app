import { useState, useEffect } from 'react';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { TaskStats } from './TaskStats';
import { ProjectTaskList } from './ProjectTaskList';
import { ProjectComments } from './ProjectComments';
import { Button } from '@/shared/components/ui/button';
import { DollarSign, Receipt, PlusCircle, ArrowRightLeft, MoreHorizontal, Pencil, Palette, Move, Copy, Archive, Trash, Star, Link as LinkIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type { Project } from '../types/project.types';
import { SalesForm } from '@/features/finance/components/SalesForm';
import { ExpenseForm } from '@/features/finance/components/ExpenseForm';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { ProjectActionsMenu } from './ProjectActionsMenu';

interface ProjectDetailPanelProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'tasks' | 'comments';

/**
 * Project Detail Panel
 * Slide-in panel with tabs for project details, tasks, and comments
 */
export function ProjectDetailPanel({ project, isOpen, onClose }: ProjectDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Load project tasks and comments
  const {
    tasks,
    stats,
    loading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
    comments,
    commentsLoading,
    addComment,
    deleteComment,
  } = useProjectTasks(project?.id || null);

  // Reset to overview tab when project changes
  useEffect(() => {
    if (project) {
      setActiveTab('overview');
    }
  }, [project?.id]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  // Mock team members (in real app, fetch from API)
  const teamMembers = [
    { id: project.pm_id || '', name: project.pm_name_text || 'Project Manager' },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Resumen',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'tasks',
      label: `Tareas (${stats?.total || 0})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'comments',
      label: `Comentarios (${comments.length})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 bg-white z-50 flex flex-col md:m-4 md:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {project.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Cliente: {project.client}
            </p>
          </div>
                <div className="flex items-center gap-2 mr-4">
                  <Button
                    onClick={() => setShowSalesForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm text-xs h-8 px-3"
                    size="sm"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Registrar Venta
                  </Button>
                  <Button
                    onClick={() => setShowExpenseForm(true)}
                    className="bg-slate-900 hover:bg-black text-white font-bold gap-2 shadow-sm text-xs h-8 px-3"
                    size="sm"
                  >
                    <Receipt className="w-3 h-3" />
                    Registrar Gasto
                  </Button>
                </div>
                
                <ProjectActionsMenu 
                  project={project} 
                  className="mr-2" 
                  onProjectDeleted={() => {
                      onClose();
                      window.location.reload(); // Simple refresh for now to update list
                  }}
                  onProjectUpdated={() => {
                      window.location.reload(); // Simple refresh for now
                  }}
                />

                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Cerrar"
                >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Información del Proyecto</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">Estado</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {project.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Línea de Negocio</span>
                    <span className="font-semibold text-gray-900">
                      {project.line_of_business || 'N/A'}
                    </span>
                  </div>

                  {project.start_date && (
                    <div>
                      <span className="text-gray-500 block mb-1">Fecha Inicio</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(project.start_date).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                      </span>
                    </div>
                  )}

                  {project.deadline && (
                    <div>
                      <span className="text-gray-500 block mb-1">Fecha Entrega</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(project.deadline).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-500 block mb-1">Presupuesto Ingreso</span>
                    <span className="font-semibold text-gray-900 text-lg text-green-600">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: project.budget_income_currency || 'COP',
                        maximumFractionDigits: 0,
                      }).format(project.budget_income || 0)}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Presupuesto Gasto</span>
                    <span className="font-semibold text-gray-900 text-lg text-red-600">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: project.budget_expense_currency || 'COP',
                        maximumFractionDigits: 0,
                      }).format(project.budget_expense || 0)}
                    </span>
                  </div>
                </div>

                {project.items_description && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Descripción:</span>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {project.items_description}
                    </p>
                  </div>
                )}
              </div>



              {/* Task Stats */}
              {stats && <TaskStats stats={stats} compact={false} />}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              {tasksLoading && tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ProjectTaskList
                  projectId={project.id}
                  tasks={tasks}
                  onAddTask={addTask as any}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  teamMembers={teamMembers}
                />
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <ProjectComments
              comments={comments}
              loading={commentsLoading}
              onAddComment={addComment}
              onDeleteComment={deleteComment}
            />
          )}
        </div>

        {/* Finance Form Dialogs */}
        <Dialog open={showSalesForm} onOpenChange={setShowSalesForm}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">Registrar Venta</DialogTitle>
            <div className="overflow-y-auto max-h-[90vh]">
              <SalesForm 
                onSuccess={() => setShowSalesForm(false)} 
                initialProjectId={project.id}
                initialClientId={project.client_id ?? undefined}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">Registrar Gasto</DialogTitle>
            <div className="overflow-y-auto max-h-[90vh]">
              <ExpenseForm 
                onSuccess={() => setShowExpenseForm(false)} 
                initialProjectId={project.id}
                initialClientId={project.client_id ?? undefined}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
