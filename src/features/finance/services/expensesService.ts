import { supabase } from '@/shared/lib/supabase';
import { GastoExtendido, GastoEntregable, Marca, Producto } from '../types/sales-expenses.types';
import { CreateGastoWithEntregablesSchema, validateOrThrow } from '@/shared/lib/validators';

// Tipo para entregable en la función RPC
interface EntregableInput {
    descripcion: string;
    cantidad: number;
    valor_unitario: number;
}

export const expensesService = {
    /**
     * Obtiene todos los gastos usando la vista optimizada
     * Usa: gastos_con_entregables (elimina N+1 queries)
     */
    async getAllExpenses() {
        const { data, error } = await supabase
            .from('gastos_con_entregables')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as GastoExtendido[];
    },

    /**
     * Obtiene gastos por proyecto usando la vista optimizada
     */
    async getExpensesByProject(projectId: string) {
        const { data, error } = await supabase
            .from('gastos_con_entregables')
            .select('*')
            .eq('proyecto_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as GastoExtendido[];
    },

    /**
     * Crea un gasto simple (sin entregables)
     * @deprecated Usar createGastoWithEntregables para operaciones atómicas
     */
    async createGasto(gasto: Omit<GastoExtendido, 'id' | 'created_at' | 'updated_at' | 'entregables'>) {
        const { data, error } = await supabase
            .from('gastos')
            .insert(gasto)
            .select()
            .single();

        if (error) throw error;
        return data as GastoExtendido;
    },

    /**
     * Crea un gasto con entregables de forma ATÓMICA
     * Usa: create_gasto_with_entregables RPC function
     * Valida con Zod antes de enviar
     */
    async createGastoWithEntregables(input: {
        project_id: string;
        provider_id: string;
        descripcion: string;
        fecha_gasto: string;
        categoria?: string;
        factura_numero?: string;
        notas?: string;
        entregables: EntregableInput[];
    }) {
        // Validar con Zod
        validateOrThrow(CreateGastoWithEntregablesSchema, input);

        const { data, error } = await supabase.rpc('create_gasto_with_entregables', {
            p_project_id: input.project_id,
            p_provider_id: input.provider_id,
            p_descripcion: input.descripcion,
            p_fecha_gasto: input.fecha_gasto,
            p_categoria: input.categoria || null,
            p_factura_numero: input.factura_numero || null,
            p_notas: input.notas || null,
            p_entregables: input.entregables,
        });

        if (error) throw error;
        return data as { gasto_id: string; total: number; entregables_count: number };
    },

    /**
     * @deprecated Usar createGastoWithEntregables para operaciones atómicas
     */
    async addEntregable(entregable: Omit<GastoEntregable, 'id'>) {
        const { data, error } = await supabase
            .from('gasto_entregables')
            .insert(entregable)
            .select()
            .single();

        if (error) throw error;
        return data as GastoEntregable;
    },

    async getMarcas(clienteId?: string) {
        let query = supabase.from('marcas').select('*');
        if (clienteId) query = query.eq('cliente_id', clienteId);

        const { data, error } = await query;
        if (error) throw error;
        return data as Marca[];
    },

    async getProductos(marcaId: string) {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('marca_id', marcaId);

        if (error) throw error;
        return data as Producto[];
    }
};
