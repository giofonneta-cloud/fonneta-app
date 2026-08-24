import { supabase } from '@/shared/lib/supabase';
import type { Quote, QuoteItem, CreateQuoteInput, CreateQuoteItemInput, QuoteStatus, QuoteDocumentType } from '../types/quote.types';

export interface QuoteFilters {
  status?: QuoteStatus;
  documentType?: QuoteDocumentType;
  search?: string;
}

function calcItemSubtotal(item: { cantidad: number; precio_unitario: number; descuento_porcentaje: number }): number {
  const factor = 1 - (item.descuento_porcentaje || 0) / 100;
  return Math.round((item.cantidad || 0) * (item.precio_unitario || 0) * factor);
}

export const quotesService = {
  async getQuotes(filters?: QuoteFilters): Promise<Quote[]> {
    let query = supabase
      .from('quotes')
      .select(`
        *,
        providers:client_id (business_name),
        projects:project_id (name),
        profiles:created_by (full_name),
        quote_items (descripcion, order_index)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.documentType) {
      query = query.eq('document_type', filters.documentType);
    }
    if (filters?.search) {
      query = query.or(`quote_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: Record<string, unknown>) => {
      const rawItems = (row.quote_items as Array<{ descripcion: string; order_index: number }>) ?? [];
      const sortedDescs = rawItems
        .sort((a, b) => a.order_index - b.order_index)
        .map((i) => i.descripcion);
      const itemsSummary = sortedDescs.length > 0
        ? sortedDescs.slice(0, 2).join(', ') + (sortedDescs.length > 2 ? ` (+${sortedDescs.length - 2})` : '')
        : undefined;

      const mapped: Record<string, unknown> = {
        ...row,
        client_registered_name: (row.providers as Record<string, string> | null)?.business_name ?? undefined,
        project_name: (row.projects as Record<string, string> | null)?.name ?? undefined,
        created_by_name: (row.profiles as Record<string, string> | null)?.full_name ?? undefined,
        items_summary: itemsSummary,
      };
      delete mapped.providers;
      delete mapped.projects;
      delete mapped.profiles;
      delete mapped.quote_items;
      return mapped as unknown as Quote;
    });
  },

  async getQuoteById(id: string): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        providers:client_id (business_name),
        projects:project_id (name),
        quote_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const row = data as Record<string, unknown>;
    const mapped: Record<string, unknown> = {
      ...row,
      items: ((row.quote_items as QuoteItem[]) ?? []).sort(
        (a: QuoteItem, b: QuoteItem) => a.order_index - b.order_index
      ),
      client_registered_name: (row.providers as Record<string, string> | null)?.business_name ?? undefined,
      project_name: (row.projects as Record<string, string> | null)?.name ?? undefined,
    };
    delete mapped.quote_items;
    delete mapped.providers;
    delete mapped.projects;
    return mapped as unknown as Quote;
  },

  async createQuote(header: CreateQuoteInput, items: CreateQuoteItemInput[]): Promise<Quote> {
    const itemsWithSubtotal = items.map((item) => ({ ...item, subtotal: calcItemSubtotal(item) }));
    const subtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
    const ivaValor = subtotal * (header.iva_porcentaje / 100);
    const total = subtotal + ivaValor;

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        ...header,
        subtotal,
        iva_valor: ivaValor,
        total,
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    if (itemsWithSubtotal.length > 0) {
      const itemsWithQuote = itemsWithSubtotal.map((item, index) => ({
        ...item,
        quote_id: quote.id,
        order_index: item.order_index ?? index,
      }));

      const { error: itemsError } = await supabase.from('quote_items').insert(itemsWithQuote);
      if (itemsError) throw itemsError;
    }

    return this.getQuoteById(quote.id);
  },

  async updateQuote(id: string, updates: Partial<CreateQuoteInput>, newItems?: CreateQuoteItemInput[]): Promise<Quote> {
    let payload: Partial<CreateQuoteInput> & { subtotal?: number; iva_valor?: number; total?: number } = { ...updates };

    if (newItems) {
      const itemsWithSubtotal = newItems.map((item) => ({ ...item, subtotal: calcItemSubtotal(item) }));
      const subtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
      const ivaPorcentaje = updates.iva_porcentaje ?? 19;
      const ivaValor = subtotal * (ivaPorcentaje / 100);
      payload = { ...payload, subtotal, iva_valor: ivaValor, total: subtotal + ivaValor };

      const { error: deleteError } = await supabase.from('quote_items').delete().eq('quote_id', id);
      if (deleteError) throw deleteError;

      if (itemsWithSubtotal.length > 0) {
        const itemsWithQuote = itemsWithSubtotal.map((item, index) => ({
          ...item,
          quote_id: id,
          order_index: item.order_index ?? index,
        }));
        const { error: insertError } = await supabase.from('quote_items').insert(itemsWithQuote);
        if (insertError) throw insertError;
      }
    }

    const { error } = await supabase
      .from('quotes')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return this.getQuoteById(id);
  },

  async updateStatus(id: string, status: QuoteStatus): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async markAsSent(id: string, documentUrl?: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'enviada' as QuoteStatus,
        sent_at: new Date().toISOString(),
        ...(documentUrl ? { document_url: documentUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteQuote(id: string): Promise<void> {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
  },
};
