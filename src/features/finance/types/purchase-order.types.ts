export type POStatus = 'borrador' | 'enviada' | 'aceptada' | 'completada' | 'cancelada';

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

export const PO_STATUS_COLORS: Record<POStatus, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  aceptada: 'bg-green-100 text-green-700',
  completada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
};

export interface PurchaseOrder {
  id: string;
  po_number: string;
  po_year: number;
  po_sequence: number;
  provider_id?: string | null;
  project_id?: string | null;
  recipient_name: string;
  recipient_nit?: string;
  recipient_address?: string;
  recipient_city?: string;
  recipient_phone?: string;
  recipient_email: string;
  authorized_by?: string;
  cost_center?: string;
  transport?: string;
  description?: string;
  subtotal: number;
  iva_porcentaje: number;
  iva_valor: number;
  otros_impuestos: number;
  total: number;
  status: POStatus;
  sent_at?: string;
  document_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joins
  items?: PurchaseOrderItem[];
  provider_name?: string;
  project_name?: string;
  items_summary?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  tarifario_id?: string | null;
  descripcion: string;
  precio: number;
  order_index: number;
  created_at: string;
}

export type CreatePOInput = Omit<PurchaseOrder, 'id' | 'po_number' | 'po_year' | 'po_sequence' | 'created_at' | 'updated_at' | 'items' | 'provider_name' | 'project_name' | 'items_summary'>;

export interface CreatePOItemInput {
  tarifario_id?: string | null;
  descripcion: string;
  precio: number;
  order_index: number;
}
