'use client';

import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { ProjectBoard } from './ProjectBoard';
import { ProjectTable } from './ProjectTable';
import { ProjectForm } from './ProjectForm';
import { ProjectDetailPanel } from './ProjectDetailPanel';
import type { Project } from '../types/project.types';
import { LayoutGrid, List, Plus, Search, Filter } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ViewMode = 'table' | 'kanban' | 'calendar' | 'gantt';

export function ProjectListView() {
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
    const { projects, isLoading, updateStatus, createProject, applyFilters, filters } = useProjects();

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
        setIsDetailPanelOpen(true);
    };

    const handleCloseDetailPanel = () => {
        setIsDetailPanelOpen(false);
        // Wait for animation to complete before clearing project
        setTimeout(() => setSelectedProject(null), 300);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Proyectos</h1>
                    <p className="text-gray-500 font-medium mt-1">Gestiona y supervisa todas las agencias y entregables.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 hover:translate-y-[-2px] active:translate-y-0 text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Proyecto
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
                    <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            viewMode === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <List className="w-4 h-4" />
                        Tabla
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            viewMode === 'kanban' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Kanban
                    </button>
                    <button className="hidden sm:flex flex-1 md:flex-none opacity-40 cursor-not-allowed items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-400">
                        Calendario
                    </button>
                    <button className="hidden sm:flex flex-1 md:flex-none opacity-40 cursor-not-allowed items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-400">
                        Gantt
                    </button>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o cliente..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            onChange={(e) => applyFilters({ search: e.target.value })}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                        <Filter className="w-4 h-4" />
                        <span>Filtros</span>
                    </button>
                </div>
            </div>

            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-bold text-gray-500 animate-pulse">Cargando proyectos...</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'kanban' && (
                            <ProjectBoard
                                projects={projects}
                                onStatusChange={updateStatus}
                                onProjectClick={handleProjectClick}
                            />
                        )}
                        {viewMode === 'table' && (
                            <ProjectTable
                                projects={projects}
                                onProjectClick={handleProjectClick}
                            />
                        )}
                    </>
                )}
            </div>

            {isFormOpen && (
                <ProjectForm
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={createProject}
                />
            )}

            {/* Project Detail Panel */}
            <ProjectDetailPanel
                project={selectedProject}
                isOpen={isDetailPanelOpen}
                onClose={handleCloseDetailPanel}
            />
        </div>
    );
}
