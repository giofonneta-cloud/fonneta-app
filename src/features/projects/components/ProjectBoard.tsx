import { Project, ProjectStatus } from '../types/project.types';
import { ProjectCard } from './ProjectCard';
import { Plus } from 'lucide-react';

interface ProjectBoardProps {
    projects: Project[];
    onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
    onProjectClick?: (project: Project) => void;
}

const columns: { id: ProjectStatus; label: string; color: string }[] = [
    { id: 'brief', label: 'Brief', color: 'bg-blue-500' },
    { id: 'diseno', label: 'Diseño', color: 'bg-purple-500' },
    { id: 'aprobacion', label: 'Aprobación', color: 'bg-yellow-500' },
    { id: 'produccion', label: 'Producción', color: 'bg-orange-500' },
    { id: 'completado', label: 'Completado', color: 'bg-green-500' },
];

export function ProjectBoard({ projects, onStatusChange, onProjectClick }: ProjectBoardProps) {
    return (
        <div className="flex gap-6 h-[calc(100vh-200px)] overflow-x-auto pb-4 custom-scrollbar">
            {columns.map((column) => {
                const columnProjects = projects.filter((p) => p.status === column.id);

                return (
                    <div key={column.id} className="flex-shrink-0 w-80 flex flex-col group">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                                <h2 className="font-semibold text-gray-700">{column.label}</h2>
                                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {columnProjects.length}
                                </span>
                            </div>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 space-y-4 overflow-y-auto custom-scrollbar border border-transparent hover:border-gray-200 transition-colors">
                            {columnProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onClick={() => onProjectClick?.(project)}
                                />
                            ))}

                            {columnProjects.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                    <p className="text-sm">Sin proyectos</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
