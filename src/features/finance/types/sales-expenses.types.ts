import { Project } from '../../projects/types/project.types';
import { Provider } from '../../providers/types/provider.types';

export type PaymentStatus = 'pendiente' | 'parcial' | 'pagado';
export type OCStatus = 'oc_recibida' | 'facturar_sin_oc';
export type ComplianceRating = 'puntual' | 'impuntual';
export type GastoEstado = 'pendiente' | 'solicite_documentos' | 'pagado';
export type EntregableEstado = 'pendiente' | 'recibido' | 'aprobado';

export interface Venta {
    id: string;
    cliente_id?: string;
    cliente?: Provider;
    proyecto_id: string;
    proyecto?: Project;
    line_of_business?: string;
    valor_venta_neto: number;
    iva_porcentaje: number;
    iva_valor: number;
    total_con_iva: number;
    estado_oc: OCStatus;
    numero_oc?: string;
    numero_factura?: string;
    fecha_factura?: string;
    plazo_pago_dias: number;
    fecha_cobro_estimada?: string;
    fecha_pago_real?: string;
    valor_pagado: number;
    estado_pago: PaymentStatus;
    calificacion_cumplimiento?: ComplianceRating;
    porcentaje_comision?: number;
    valor_comision?: number;
    responsable_comision_id?: string;
    notas_internas?: string;
    created_at: string;
    updated_at: string;
}

export interface GastoEntregable {
    id: string;
    gasto_id: string;
    nombre: string;
    fecha_entrega_comprometida?: string;
    fecha_entrega_real?: string;
    estado: EntregableEstado;
    archivos_urls: string[];
}

export interface GastoExtendido {
    id: string;
    proyecto_id?: string;
    proveedor_id: string;
    valor_neto: number;
    iva_porcentaje: number;
    iva_valor: number;
    total_con_iva: number;
    categoria: string;
    codigo_oc?: string;
    codigo_release?: string;
    numero_factura_proveedor?: string;
    factura_url?: string;
    fecha_radicado?: string;
    fecha_limite_pago?: string;
    estado_pago: GastoEstado;
    documentos_faltantes?: string[];
    fecha_pago_real?: string;
    comprobante_pago_url?: string;
    metodo_pago?: string;
    observaciones?: string;
    entregables?: GastoEntregable[];
    created_at: string;
    updated_at: string;
}

export interface Marca {
    id: string;
    nombre: string;
    cliente_id?: string;
}

export interface Producto {
    id: string;
    nombre: string;
    marca_id: string;
}
