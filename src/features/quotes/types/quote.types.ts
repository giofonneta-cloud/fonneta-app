export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  aceptada: 'bg-emerald-100 text-emerald-700',
  rechazada: 'bg-red-100 text-red-700',
};

export interface Quote {
  id: string;
  quote_number: string;
  quote_year: number;
  quote_sequence: number;
  client_id?: string | null;
  client_name: string;
  client_contact_name?: string;
  client_nit?: string;
  client_address?: string;
  client_city?: string;
  client_phone?: string;
  client_email: string;
  project_id?: string | null;
  cost_center?: string;
  valid_until?: string;
  intro_text?: string;
  closing_text?: string;
  subtotal: number;
  iva_porcentaje: number;
  iva_valor: number;
  total: number;
  status: QuoteStatus;
  sent_at?: string;
  document_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joins
  items?: QuoteItem[];
  client_registered_name?: string;
  project_name?: string;
  items_summary?: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  tarifario_id?: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  subtotal: number;
  order_index: number;
  created_at: string;
}

export type CreateQuoteInput = Omit<
  Quote,
  'id' | 'quote_number' | 'quote_year' | 'quote_sequence' | 'created_at' | 'updated_at' | 'items' | 'client_registered_name' | 'project_name' | 'items_summary'
>;

export interface CreateQuoteItemInput {
  tarifario_id?: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  order_index: number;
}
