import { createClient } from '@/lib/supabase/client';
import type { CotizacionItem, CotizacionTotals, CreateCotizacionItemInput, UpdateCotizacionItemInput } from '../types/quote.types';

const supabase = createClient();
const IVA_RATE = 0.19;

export const quoteService = {
  async getCotizacionByProject(projectId: string): Promise<CotizacionItem[]> {
    const { data, error } = await supabase
      .from('cotizacion_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) throw new Error(`Error al cargar cotización: ${error.message}`);
    return data as CotizacionItem[];
  },

  async addCotizacionItem(input: CreateCotizacionItemInput): Promise<CotizacionItem> {
    const subtotal = quoteService.calcularSubtotal(input.cantidad, input.precio_unitario, input.descuento_porcentaje);
    const { data, error } = await supabase
      .from('cotizacion_items')
      .insert({ ...input, subtotal })
      .select()
      .single();

    if (error) throw new Error(`Error al agregar ítem: ${error.message}`);
    return data as CotizacionItem;
  },

  async updateCotizacionItem(id: string, updates: UpdateCotizacionItemInput): Promise<CotizacionItem> {
    const payload: UpdateCotizacionItemInput & { subtotal?: number } = { ...updates };
    if (updates.cantidad !== undefined || updates.precio_unitario !== undefined || updates.descuento_porcentaje !== undefined) {
      // We need all three values to recalculate — fetch current if not provided
      const current = await supabase
        .from('cotizacion_items')
        .select('cantidad, precio_unitario, descuento_porcentaje')
        .eq('id', id)
        .single();

      if (!current.error && current.data) {
        const cantidad = updates.cantidad ?? current.data.cantidad;
        const precio = updates.precio_unitario ?? current.data.precio_unitario;
        const descuento = updates.descuento_porcentaje ?? current.data.descuento_porcentaje;
        payload.subtotal = quoteService.calcularSubtotal(cantidad, precio, descuento);
      }
    }

    const { data, error } = await supabase
      .from('cotizacion_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar ítem: ${error.message}`);
    return data as CotizacionItem;
  },

  async deleteCotizacionItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('cotizacion_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar ítem: ${error.message}`);
  },

  calcularSubtotal(cantidad: number, precioUnitario: number, descuentoPorcentaje: number): number {
    const factor = 1 - descuentoPorcentaje / 100;
    return Math.round(cantidad * precioUnitario * factor);
  },

  calcularTotales(items: CotizacionItem[]): CotizacionTotals {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = Math.round(subtotal * IVA_RATE);
    return { subtotal, iva, total: subtotal + iva };
  },
};
