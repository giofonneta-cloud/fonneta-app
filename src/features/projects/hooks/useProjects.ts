import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectFilters, ProjectStatus } from '../types/project.types';
import { projectService } from '../services/projectService';

export function useProjects(initialFilters?: ProjectFilters) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filters, setFilters] = useState<ProjectFilters>(initialFilters || {});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await projectService.getProjects(filters);
            setProjects(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const updateStatus = async (projectId: string, newStatus: ProjectStatus) => {
        try {
            const updated = await projectService.updateProjectStatus(projectId, newStatus);
            setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
            return updated;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const created = await projectService.createProject(project);
            setProjects(prev => [created, ...prev]);
            return created;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const applyFilters = (newFilters: ProjectFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return {
        projects,
        filters,
        isLoading,
        error,
        updateStatus,
        createProject,
        applyFilters,
        refresh: fetchProjects
    };
}
