export interface CotizacionItem {
  id: string;
  project_id: string;
  tarifario_id?: string | null;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  cost_center?: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  precio_piso?: number | null;
  precio_techo?: number | null;
  descuento_porcentaje: number;
  subtotal: number;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface CotizacionTotals {
  subtotal: number;
  iva: number;
  total: number;
}

export type CreateCotizacionItemInput = Omit<CotizacionItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCotizacionItemInput = Partial<Pick<CotizacionItem, 'nombre' | 'descripcion' | 'cantidad' | 'precio_unitario' | 'descuento_porcentaje' | 'subtotal' | 'notas'>>;
