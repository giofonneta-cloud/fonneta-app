import { supabase } from '@/shared/lib/supabase';
import type { PurchaseOrder, PurchaseOrderItem, CreatePOInput, CreatePOItemInput, POStatus } from '../types/purchase-order.types';

export interface POFilters {
  status?: POStatus;
  search?: string;
}

export const purchaseOrderService = {
  async getPurchaseOrders(filters?: POFilters): Promise<PurchaseOrder[]> {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        providers:provider_id (business_name),
        projects:project_id (name),
        purchase_order_items (descripcion, order_index)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`po_number.ilike.%${filters.search}%,recipient_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => {
      const rawItems = (row.purchase_order_items as Array<{ descripcion: string; order_index: number }>) ?? [];
      const sortedDescs = rawItems
        .sort((a, b) => a.order_index - b.order_index)
        .map((i) => i.descripcion);
      const itemsSummary = sortedDescs.length > 0
        ? sortedDescs.slice(0, 2).join(', ') + (sortedDescs.length > 2 ? ` (+${sortedDescs.length - 2})` : '')
        : undefined;

      const mapped: Record<string, unknown> = {
        ...row,
        provider_name: (row.providers as Record<string, string> | null)?.business_name ?? undefined,
        project_name: (row.projects as Record<string, string> | null)?.name ?? undefined,
        items_summary: itemsSummary,
      };
      delete mapped.providers;
      delete mapped.projects;
      delete mapped.purchase_order_items;
      return mapped as unknown as PurchaseOrder;
    });
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        providers:provider_id (business_name),
        projects:project_id (name),
        purchase_order_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const row = data as Record<string, unknown>;
    const mapped: Record<string, unknown> = {
      ...row,
      items: ((row.purchase_order_items as PurchaseOrderItem[]) ?? []).sort(
        (a: PurchaseOrderItem, b: PurchaseOrderItem) => a.order_index - b.order_index
      ),
      provider_name: (row.providers as Record<string, string> | null)?.business_name ?? undefined,
      project_name: (row.projects as Record<string, string> | null)?.name ?? undefined,
    };
    delete mapped.purchase_order_items;
    delete mapped.providers;
    delete mapped.projects;
    return mapped as unknown as PurchaseOrder;
  },

  async createPurchaseOrder(
    header: CreatePOInput,
    items: CreatePOItemInput[]
  ): Promise<PurchaseOrder> {
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.precio, 0);
    const ivaValor = subtotal * (header.iva_porcentaje / 100);
    const total = subtotal + ivaValor + (header.otros_impuestos || 0);

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        ...header,
        subtotal,
        iva_valor: ivaValor,
        total,
      })
      .select()
      .single();

    if (poError) throw poError;

    if (items.length > 0) {
      const itemsWithPO = items.map((item, index) => ({
        ...item,
        purchase_order_id: po.id,
        order_index: item.order_index ?? index,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsWithPO);

      if (itemsError) throw itemsError;
    }

    return this.getPurchaseOrderById(po.id);
  },

  async updatePurchaseOrder(
    id: string,
    updates: Partial<CreatePOInput>,
    newItems?: CreatePOItemInput[]
  ): Promise<PurchaseOrder> {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // Sync items: delete all existing, re-insert new ones
    if (newItems) {
      const { error: deleteError } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id);

      if (deleteError) throw deleteError;

      if (newItems.length > 0) {
        const itemsWithPO = newItems.map((item, index) => ({
          ...item,
          purchase_order_id: id,
          order_index: item.order_index ?? index,
        }));

        const { error: insertError } = await supabase
          .from('purchase_order_items')
          .insert(itemsWithPO);

        if (insertError) throw insertError;
      }
    }

    return this.getPurchaseOrderById(id);
  },

  async addItem(poId: string, item: CreatePOItemInput): Promise<PurchaseOrderItem> {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .insert({ ...item, purchase_order_id: poId })
      .select()
      .single();

    if (error) throw error;
    await this.recalcTotals(poId);
    return data as PurchaseOrderItem;
  },

  async updateItem(itemId: string, updates: Partial<CreatePOItemInput>): Promise<void> {
    const { data: item, error: fetchError } = await supabase
      .from('purchase_order_items')
      .select('purchase_order_id')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('purchase_order_items')
      .update(updates)
      .eq('id', itemId);

    if (error) throw error;
    await this.recalcTotals(item.purchase_order_id);
  },

  async deleteItem(itemId: string, poId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_order_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    await this.recalcTotals(poId);
  },

  async recalcTotals(poId: string): Promise<void> {
    const { data: items, error: fetchError } = await supabase
      .from('purchase_order_items')
      .select('precio')
      .eq('purchase_order_id', poId);

    if (fetchError) throw fetchError;

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('iva_porcentaje, otros_impuestos')
      .eq('id', poId)
      .single();

    if (poError) throw poError;

    const subtotal = (items ?? []).reduce((sum, i) => sum + Number(i.precio), 0);
    const ivaValor = subtotal * (Number(po.iva_porcentaje) / 100);
    const total = subtotal + ivaValor + Number(po.otros_impuestos || 0);

    const { error } = await supabase
      .from('purchase_orders')
      .update({ subtotal, iva_valor: ivaValor, total, updated_at: new Date().toISOString() })
      .eq('id', poId);

    if (error) throw error;
  },

  async markAsSent(id: string, documentUrl?: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'enviada' as POStatus,
        sent_at: new Date().toISOString(),
        ...(documentUrl ? { document_url: documentUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async updateStatus(id: string, status: POStatus): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async deletePurchaseOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
