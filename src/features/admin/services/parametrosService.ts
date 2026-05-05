import { createClient } from '@/lib/supabase/client';
import type { Parametro, NewParametro } from '@/features/admin/types/admin.types';

const supabase = createClient();

export const parametrosService = {
    async getByCategoria(categoria: string): Promise<Parametro[]> {
        const { data, error } = await supabase
            .from('parametros')
            .select('*')
            .eq('categoria', categoria)
            .eq('activo', true)
            .order('orden', { ascending: true });
        if (error) throw error;
        return data ?? [];
    },

    async getAll(): Promise<Record<string, Parametro[]>> {
        const { data, error } = await supabase
            .from('parametros')
            .select('*')
            .eq('activo', true)
            .order('categoria')
            .order('orden', { ascending: true });
        if (error) throw error;
        return (data ?? []).reduce<Record<string, Parametro[]>>((acc, p) => {
            if (!acc[p.categoria]) acc[p.categoria] = [];
            acc[p.categoria].push(p);
            return acc;
        }, {});
    },

    async create(data: NewParametro): Promise<Parametro> {
        const { data: created, error } = await supabase
            .from('parametros')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return created;
    },

    async update(id: string, data: Partial<NewParametro>): Promise<Parametro> {
        const { data: updated, error } = await supabase
            .from('parametros')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return updated;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('parametros')
            .update({ activo: false, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    },

    async reorder(items: { id: string; orden: number }[]): Promise<void> {
        await Promise.all(
            items.map(({ id, orden }) =>
                supabase.from('parametros').update({ orden }).eq('id', id)
            )
        );
    },
};
