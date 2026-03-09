export type TipoProducto = 'editorial' | 'evento' | 'digital' | 'btl';

export const TIPO_PRODUCTO_LABELS: Record<TipoProducto, string> = {
  editorial: 'Editorial',
  evento: 'Evento',
  digital: 'Digital',
  btl: 'BTL',
};

export const TIPO_PRODUCTO_COLORS: Record<TipoProducto, string> = {
  editorial: 'bg-purple-100 text-purple-700',
  evento: 'bg-orange-100 text-orange-700',
  digital: 'bg-blue-100 text-blue-700',
  btl: 'bg-green-100 text-green-700',
};

export const COST_CENTERS = ['FUSCIA', 'SOHO', 'MONICA J', 'FONNETA', 'CLUB INDOMITAS'] as const;
export type CostCenter = typeof COST_CENTERS[number];

export interface TarifarioItem {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto;
  cost_center?: CostCenter;
  unidad: string;
  precio_piso: number;
  precio_techo: number;
  descuento_maximo: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TarifarioFilters {
  tipo?: TipoProducto;
  cost_center?: CostCenter;
  search?: string;
  activeOnly?: boolean;
}

export type CreateTarifarioInput = Omit<TarifarioItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTarifarioInput = Partial<CreateTarifarioInput>;
