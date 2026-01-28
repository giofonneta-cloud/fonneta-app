import { Project } from '../types/project.types';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ProjectTableProps {
    projects: Project[];
    onProjectClick?: (project: Project) => void;
}

const statusColors: Record<string, string> = {
    brief: 'text-blue-600 bg-blue-50 border-blue-100',
    diseno: 'text-purple-600 bg-purple-50 border-purple-100',
    aprobacion: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    produccion: 'text-orange-600 bg-orange-50 border-orange-100',
    completado: 'text-green-600 bg-green-50 border-green-100',
    facturado: 'text-gray-600 bg-gray-50 border-gray-100',
};

export function ProjectTable({ projects, onProjectClick }: ProjectTableProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Proyecto</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Entrega</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Presupuesto</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => onProjectClick?.(project)}>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</span>
                                        <span className="text-xs text-gray-500 uppercase font-medium">{project.service_type || 'General'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide",
                                        statusColors[project.status]
                                    )}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-gray-600">{project.client}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : '--'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-bold text-gray-900">
                                        {project.budget_income?.toLocaleString() || '0'}
                                    </span>
                                    <span className="text-[10px] ml-1 font-bold text-gray-400">{project.budget_income_currency}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <ProjectActionsMenu 
                                            project={project} 
                                            onProjectUpdated={() => window.location.reload()}
                                            onProjectDeleted={() => window.location.reload()}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p className="font-medium">No se encontraron proyectos</p>
                    <span className="text-xs">Intenta ajustar los filtros</span>
                </div>
            )}
        </div>
    );
}
