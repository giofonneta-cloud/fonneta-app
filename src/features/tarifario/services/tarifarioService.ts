import { createClient } from '@/lib/supabase/client';
import type { TarifarioItem, TarifarioFilters, CreateTarifarioInput, UpdateTarifarioInput } from '../types/tarifario.types';

const supabase = createClient();

export const tarifarioService = {
  async getTarifario(filters?: TarifarioFilters): Promise<TarifarioItem[]> {
    let query = supabase
      .from('tarifario')
      .select('*')
      .order('tipo')
      .order('nombre');

    if (filters?.activeOnly !== false) {
      query = query.eq('is_active', true);
    }
    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo);
    }
    if (filters?.cost_center) {
      query = query.eq('cost_center', filters.cost_center);
    }
    if (filters?.search) {
      query = query.ilike('nombre', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error al obtener tarifario: ${error.message}`);
    return data as TarifarioItem[];
  },

  async getTarifarioItem(id: string): Promise<TarifarioItem> {
    const { data, error } = await supabase
      .from('tarifario')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error al obtener ítem: ${error.message}`);
    return data as TarifarioItem;
  },

  async createTarifarioItem(input: CreateTarifarioInput): Promise<TarifarioItem> {
    const { data, error } = await supabase
      .from('tarifario')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`Error al crear ítem: ${error.message}`);
    return data as TarifarioItem;
  },

  async updateTarifarioItem(id: string, updates: UpdateTarifarioInput): Promise<TarifarioItem> {
    const { data, error } = await supabase
      .from('tarifario')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar ítem: ${error.message}`);
    return data as TarifarioItem;
  },

  async deleteTarifarioItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('tarifario')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar ítem: ${error.message}`);
  },

  async toggleActive(id: string, isActive: boolean): Promise<TarifarioItem> {
    return tarifarioService.updateTarifarioItem(id, { is_active: isActive });
  },
};
