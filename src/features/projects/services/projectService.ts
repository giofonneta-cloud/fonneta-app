import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { Project, ProjectFilters, ProjectStatus } from '../types/project.types';

export const projectService = {
    async getProjects(filters?: ProjectFilters) {
        let query = supabase.from('projects').select('*');

        if (filters?.status && filters.status.length > 0) {
            query = query.in('status', filters.status);
        }

        if (filters?.client) {
            query = query.ilike('client', `%${filters.client}%`);
        }

        if (filters?.pm_id) {
            query = query.eq('pm_id', filters.pm_id);
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,client.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data as Project[];
    },

    async getProjectById(id: string) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Project;
    },

    async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
        console.log("💾 CREATE PROJECT (Fixed Payload)...");
        
        // 0. Autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado.");
        const userId = user.id;

        try {
            // 1. CONSTRUCCIÓN DEL PAYLOAD MANUAL Y SEGURO
            // Forzamos pm_id porque es la única columna de dueño válida detectada hasta ahora.
            // Ignoramos dinámicas para asegurar que el dato se envíe.
            const payload = {
                name: project.name,
                client: project.client, // Nombre del cliente (String)
                status: project.status || 'brief',
                pm_id: userId, // CRÍTICO: Debe enviarse para pasar RLS
                start_date: project.start_date,
                budget_income: project.budget_income,
                budget_expense: project.budget_expense,
                budget_income_currency: project.budget_income_currency || 'COP',
                budget_expense_currency: project.budget_expense_currency || 'COP'
                // items_description, product_image_url etc. pueden agregarse si estamos seguros, 
                // pero por seguridad de "Survival" los omitimos o los agregamos con cuidado si no dieron error antes.
                // Como budget_income funcionó, esos se quedan.
            };

            console.log("🚀 Enviando Payload Definitivo:", payload);

            const { data, error } = await supabase
                .from('projects')
                .insert(payload)
                .select()
                .single();

            if (error) {
                console.error("❌ Error inserción definitiva:", JSON.stringify(error, null, 2));
                throw error;
            }

            console.log("✅ Proyecto creado exitosamente.");
            return data as Project;

        } catch (err: any) {
            console.error("🔥 Error crítico en createProject:", err);
            
            if (err?.code === '42501' || err?.message?.includes('violates row-level security')) {
                throw new Error("⚠️ Error de permisos (RLS). A pesar de enviar pm_id, la base de datos rechaza la inserción. Verifica si tu usuario está activo.");
            }
            if (err?.code === 'PGRST204') {
                 // Si falla por columna, lo mostramos claro
                 throw new Error(`Error de columna: ${err.message}`);
            }
            throw err;
        }
    },

    async updateProject(id: string, updates: Partial<Project>) {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Project;
    },

    async updateProjectStatus(id: string, status: ProjectStatus) {
        const { data, error } = await supabase
            .from('projects')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Project;
    },

    async deleteProject(id: string) {
        console.log(`🗑️ Iniciando eliminación robusta del proyecto ${id}...`);

        try {
            // 1. Obtener IDs de gastos para eliminar sus entregables dependientes
            const { data: gastos, error: fetchGastosError } = await supabase
                .from('gastos')
                .select('id')
                .eq('proyecto_id', id);

            if (fetchGastosError) {
                console.error("❌ Error al obtener gastos del proyecto:", fetchGastosError);
                throw fetchGastosError;
            }

            const gastoIds = gastos?.map(g => g.id) || [];
            console.log(`found ${gastoIds.length} gastos associated with project`);

            if (gastoIds.length > 0) {
                // 2. Eliminar entregables de los gastos (Deep Clean)
                const { error: entregablesError } = await supabase
                    .from('gasto_entregables')
                    .delete()
                    .in('gasto_id', gastoIds);
                
                if (entregablesError) console.error("⚠️ Error eliminando entregables de gastos:", entregablesError);
            }

            // 3. Ejecutar eliminaciones directas en paralelo
            // - Gastos (ya limpiamos entregables)
            // - Ventas
            // - Tareas
            // - Comentarios
            const results = await Promise.allSettled([
                supabase.from('gastos').delete().eq('proyecto_id', id),
                supabase.from('ventas').delete().eq('proyecto_id', id),
                supabase.from('project_tasks').delete().eq('project_id', id),
                supabase.from('project_comments').delete().eq('project_id', id),
            ]);

            // Log de resultados
            results.forEach((res, idx) => {
                if (res.status === 'rejected') {
                    console.error(`❌ Fallo en paso de limpieza ${idx}:`, res.reason);
                }
            });

            // 4. Finalmente eliminar el proyecto
            const { error: projectError } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (projectError) {
                console.error("❌ Error FATAL al eliminar proyecto:", projectError);
                throw projectError; // Re-throw para que el UI se entere
            }

            console.log("✅ Proyecto eliminado exitosamente");

        } catch (error) {
            console.error("❌ Excepción en proceso de eliminación:", error);
            throw error;
        }
    },

    async duplicateProject(project: Project) {
        // Prepare the new project object excluding ID and dates
        const { id, created_at, updated_at, ...projectData } = project;

        const newProject = {
            ...projectData,
            name: `Copia de ${project.name}`,
            status: 'brief' as ProjectStatus, // Reset status or keep it? Start fresh usually.
        };

        const { data, error } = await supabase
            .from('projects')
            .insert(newProject)
            .select()
            .single();

        if (error) throw error;
        return data as Project;
    },

    /**
     * Completa un proyecto de forma atómica
     * Valida que no haya tareas pendientes y calcula márgenes
     * Usa: completar_proyecto RPC function
     */
    async completarProyecto(projectId: string): Promise<{
        success: boolean;
        project_id: string;
        total_ventas: number;
        total_gastos: number;
        margen_bruto: number;
        margen_porcentaje: number;
        tareas_completadas: number;
    }> {
        const { data, error } = await supabase.rpc('completar_proyecto', {
            p_project_id: projectId,
        });

        if (error) {
            // Manejo especial para tareas pendientes
            if (error.message?.includes('tareas pendientes')) {
                throw new Error('No se puede completar el proyecto: hay tareas sin terminar');
            }
            throw error;
        }

        return data;
    },

    /**
     * Obtiene proyectos con estadísticas usando la vista optimizada
     * Usa: projects_with_stats view
     */
    async getProjectsWithStats(filters?: ProjectFilters) {
        let query = supabase.from('projects_with_stats').select('*');

        if (filters?.status && filters.status.length > 0) {
            query = query.in('status', filters.status);
        }

        if (filters?.client) {
            query = query.ilike('client', `%${filters.client}%`);
        }

        if (filters?.pm_id) {
            query = query.eq('pm_id', filters.pm_id);
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,client.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Obtiene las alertas del usuario actual
     * Usa: my_alerts view
     */
    async getMyAlerts() {
        const { data, error } = await supabase
            .from('my_alerts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
