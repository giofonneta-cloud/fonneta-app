export type LegalizacionStatus = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'cerrada';
export type AnticipoStatus = 'solicitado' | 'aprobado' | 'rechazado' | 'pagado' | 'legalizado';
export type BeneficiarioTipo = 'empleado' | 'contratista';
export type RevisionEstado = 'pendiente' | 'aprobada' | 'observada';

export const LEGALIZACION_STATUS_LABELS: Record<LegalizacionStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Por aprobar',
  aprobada: 'Aprobada',
  rechazada: 'Devuelta',
  cerrada: 'Cerrada',
};

export const LEGALIZACION_STATUS_COLORS: Record<LegalizacionStatus, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-amber-100 text-amber-700',
  aprobada: 'bg-blue-100 text-blue-700',
  rechazada: 'bg-red-100 text-red-700',
  cerrada: 'bg-emerald-100 text-emerald-700',
};

export const ANTICIPO_STATUS_LABELS: Record<AnticipoStatus, string> = {
  solicitado: 'Por aprobar',
  aprobado: 'Aprobado (por pagar)',
  rechazado: 'Rechazado',
  pagado: 'Pagado (por legalizar)',
  legalizado: 'Legalizado',
};

export const ANTICIPO_STATUS_COLORS: Record<AnticipoStatus, string> = {
  solicitado: 'bg-amber-100 text-amber-700',
  aprobado: 'bg-blue-100 text-blue-700',
  rechazado: 'bg-red-100 text-red-700',
  pagado: 'bg-violet-100 text-violet-700',
  legalizado: 'bg-emerald-100 text-emerald-700',
};

export const BENEFICIARIO_TIPO_LABELS: Record<BeneficiarioTipo, string> = {
  empleado: 'Empleado',
  contratista: 'Contratista / Proveedor',
};

export interface LegalizacionItem {
  id: string;
  legalizacion_id: string;
  fecha: string | null;
  categoria: string | null;
  categoria_etiqueta: string | null;
  establecimiento: string | null;
  establecimiento_nit: string | null;
  numero_soporte: string | null;
  descripcion: string | null;
  comentario: string | null;
  observacion_revisor: string | null;
  revision_estado: RevisionEstado;
  valor: number;
  soporte_url: string | null;
  soporte_nombre: string | null;
  order_index: number;
}

export interface Legalizacion {
  id: string;
  numero: string;
  user_id: string;
  provider_id: string | null;
  beneficiario_tipo: BeneficiarioTipo;
  beneficiario_nombre: string;
  beneficiario_documento: string | null;
  beneficiario_area: string | null;
  motivo: string | null;
  cost_center: string | null;
  project_id: string | null;
  fecha_reporte: string;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  anticipo_id: string | null;
  total_gastos: number;
  anticipo_recibido: number;
  saldo_empleado: number;
  saldo_empresa: number;
  status: LegalizacionStatus;
  motivo_rechazo: string | null;
  enviado_at: string | null;
  aprobado_por: string | null;
  aprobado_por_nombre: string | null;
  aprobado_por_cargo: string | null;
  aprobado_at: string | null;
  cerrado_at: string | null;
  cierre_nota: string | null;
  created_at: string;
  items?: LegalizacionItem[];
}

export interface Anticipo {
  id: string;
  numero: string;
  user_id: string;
  beneficiario_tipo: BeneficiarioTipo;
  beneficiario_nombre: string;
  beneficiario_documento: string | null;
  monto: number;
  motivo: string;
  cost_center: string | null;
  project_id: string | null;
  status: AnticipoStatus;
  motivo_rechazo: string | null;
  aprobado_por_nombre: string | null;
  fecha_pago: string | null;
  created_at: string;
}

export type LegalizacionHeaderInput = Pick<
  Legalizacion,
  | 'beneficiario_tipo'
  | 'beneficiario_nombre'
  | 'beneficiario_documento'
  | 'beneficiario_area'
  | 'motivo'
  | 'cost_center'
  | 'project_id'
  | 'fecha_reporte'
  | 'periodo_desde'
  | 'periodo_hasta'
  | 'anticipo_id'
  | 'total_gastos'
  | 'anticipo_recibido'
  | 'saldo_empleado'
  | 'saldo_empresa'
>;

export type LegalizacionItemInput = Omit<
  LegalizacionItem,
  'id' | 'legalizacion_id' | 'observacion_revisor' | 'revision_estado'
>;

// `id` solo existe en líneas ya guardadas; las aprobadas no se reescriben.
export interface ItemSaveInput extends LegalizacionItemInput {
  id: string | null;
  revision_estado: RevisionEstado;
}

export type AnticipoInput = Pick<
  Anticipo,
  'beneficiario_tipo' | 'beneficiario_nombre' | 'beneficiario_documento' | 'monto' | 'motivo' | 'cost_center' | 'project_id'
>;

export interface BeneficiarioDefaults {
  tipo: BeneficiarioTipo;
  nombre: string;
  documento: string;
  area: string;
}
