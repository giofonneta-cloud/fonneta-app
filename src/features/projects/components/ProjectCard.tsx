import { Project } from '../types/project.types';
import { Calendar, User, DollarSign, FileText, Tag } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskStats } from './TaskStats';
import type { TaskStats as TaskStatsType } from '../types/task.types';
import { ProjectActionsMenu } from './ProjectActionsMenu';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ProjectCardProps {
    project: Project;
    onClick?: () => void;
    taskStats?: TaskStatsType;
}

const statusColors: Record<string, string> = {
    brief: 'bg-blue-100 text-blue-700 border-blue-200',
    diseno: 'bg-purple-100 text-purple-700 border-purple-200',
    aprobacion: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    produccion: 'bg-orange-100 text-orange-700 border-orange-200',
    completado: 'bg-green-100 text-green-700 border-green-200',
    facturado: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function ProjectCard({ project, onClick, taskStats }: ProjectCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer space-y-4 group overflow-hidden relative"
        >
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <ProjectActionsMenu 
                    project={project} 
                    className="bg-white/90 backdrop-blur-sm shadow-sm"
                    onProjectUpdated={() => window.location.reload()}
                    onProjectDeleted={() => window.location.reload()}
                />
            </div>

            {project.product_image_url && (
                <div className="relative h-32 -mx-4 -mt-4 mb-4 overflow-hidden bg-gray-100">
                    <img
                        src={project.product_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Fonnettapp+Resource';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}

            <div className="flex justify-between items-start">
                <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                    statusColors[project.status]
                )}>
                    {project.status}
                </span>
                {project.quotation_number && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <FileText className="w-3 h-3" />
                        {project.quotation_number}
                    </div>
                )}
            </div>

            <div>
                <h3 className="font-extrabold text-gray-900 leading-tight text-base group-hover:text-blue-600 transition-colors">
                    {project.name}
                </h3>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {project.client}
                </p>
            </div>

            {project.product_name && (
                <div className="bg-blue-50/50 p-2 rounded-xl text-[10px] font-bold text-blue-700 border border-blue-100">
                    {project.product_name}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : (project.period || 'PENDIENTE')}</span>
                </div>
                <div className="flex items-center text-xs font-black text-gray-900 gap-1 justify-end">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    <span>
                        {(project.total_value_with_tax || project.budget_income || project.net_value || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Task Progress Indicator */}
            {taskStats && taskStats.total > 0 && (
                <div className="pt-3 border-t border-gray-100">
                    <TaskStats stats={taskStats} compact={true} />
                </div>
            )}

            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-blue-100">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">PM</span>
                        <span className="text-[10px] font-bold text-gray-900 leading-tight truncate max-w-[100px]">
                            {project.pm_name_text || 'Sin asignar'}
                        </span>
                    </div>
                </div>
                <div className="text-[10px] font-black text-gray-400">
                    {project.line_of_business || 'General'}
                </div>
            </div>
        </div>
    );
}
