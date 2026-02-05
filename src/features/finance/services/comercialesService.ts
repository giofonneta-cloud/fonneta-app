import { supabase } from '@/shared/lib/supabase';

export interface Comercial {
    id: string;
    nombre: string;
    email?: string;
    telefono?: string;
    porcentaje_comision_default: number;
    is_active: boolean;
    notas?: string;
    created_at: string;
    updated_at: string;
}

export type CreateComercialInput = Omit<Comercial, 'id' | 'created_at' | 'updated_at'>;
export type UpdateComercialInput = Partial<CreateComercialInput>;

export const comercialesService = {
    /**
     * Obtiene todos los comerciales activos
     */
    async getComerciales(includeInactive = false) {
        let query = supabase
            .from('comerciales')
            .select('*')
            .order('nombre', { ascending: true });

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Comercial[];
    },

    /**
     * Obtiene un comercial por ID
     */
    async getComercialById(id: string) {
        const { data, error } = await supabase
            .from('comerciales')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Comercial;
    },

    /**
     * Crea un nuevo comercial (solo admin)
     */
    async createComercial(input: CreateComercialInput) {
        const { data, error } = await supabase
            .from('comerciales')
            .insert({
                nombre: input.nombre,
                email: input.email || null,
                telefono: input.telefono || null,
                porcentaje_comision_default: input.porcentaje_comision_default ?? 10,
                is_active: input.is_active ?? true,
                notas: input.notas || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error al crear comercial:', error);
            throw error;
        }

        return data as Comercial;
    },

    /**
     * Actualiza un comercial existente (solo admin)
     */
    async updateComercial(id: string, input: UpdateComercialInput) {
        const { data, error } = await supabase
            .from('comerciales')
            .update(input)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error al actualizar comercial:', error);
            throw error;
        }

        return data as Comercial;
    },

    /**
     * Desactiva un comercial (soft delete)
     */
    async deactivateComercial(id: string) {
        return this.updateComercial(id, { is_active: false });
    },

    /**
     * Reactiva un comercial
     */
    async activateComercial(id: string) {
        return this.updateComercial(id, { is_active: true });
    },

    /**
     * Elimina un comercial permanentemente (solo admin)
     */
    async deleteComercial(id: string) {
        const { error } = await supabase
            .from('comerciales')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar comercial:', error);
            throw error;
        }
    },
};
