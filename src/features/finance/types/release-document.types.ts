import { COST_CENTERS, type CostCenter } from '@/features/tarifario/types/tarifario.types';

export type TipoRelease = 'aim' | 'obr' | 'coe';
export type MarcaRelease = CostCenter; // reutiliza el enum de marcas/centros de costo internos de Fonneta
export type ReleaseStatus = 'pendiente_firma' | 'firmado';

export const MARCAS_RELEASE = COST_CENTERS;

export const TIPO_RELEASE_LABELS: Record<TipoRelease, string> = {
    aim: 'AIM — Autorización de Uso de Imagen',
    obr: 'OBR — Autorización Uso y Publicación de Obras y/o Fonogramas',
    coe: 'COE — Contrato de Obra por Encargo',
};

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
    pendiente_firma: 'Pendiente de firma',
    firmado: 'Firmado',
};

export const RELEASE_STATUS_COLORS: Record<ReleaseStatus, string> = {
    pendiente_firma: 'bg-amber-100 text-amber-700',
    firmado: 'bg-emerald-100 text-emerald-700',
};

export interface ReleaseAimCampos {
    sesion_nombre: string;
    lugar_fecha: string;
    fotografo_nombre: string;
    no_fotografias?: string;
    no_audiovisuales?: string;
}

export interface ReleaseObra {
    tipo_obra: 'Fotográfica' | 'Audiovisual' | 'Literaria' | 'Artística' | 'Otro';
    tipo_obra_otro?: string;
    nombre_descripcion: string;
    autor: string;
    producto_editorial: string;
}

export interface ReleaseObrCampos {
    autor_nombre: string;
    representa_sociedad?: string;
    nombre_campana: string;
    tipo_derecho: 'fonograma' | 'obra';
    obras: ReleaseObra[];
    forma_pago: 'gratuito' | 'oneroso';
    valor_pago?: number;
    fecha_firma?: string;
}

export interface ReleaseCoeObra {
    descripcion: string;
}

export interface ReleaseCoeCampos {
    encargado_nombre: string;
    tipo_derecho: 'fonograma' | 'obra';
    obras: ReleaseCoeObra[];
    valor_pago: number;
    representante_fonneta: string;
    fecha_firma?: string;
}

export type ReleaseCampos = ReleaseAimCampos | ReleaseObrCampos | ReleaseCoeCampos;

export interface ReleaseDocument {
    id: string;
    release_number: string;
    release_year: number;
    release_month: number;
    release_sequence: number;
    tipo_release: TipoRelease;
    marca: MarcaRelease;
    purchase_order_id?: string | null;
    provider_id?: string | null;
    recipient_email: string;
    recipient_name: string;
    campos: ReleaseCampos;
    status: ReleaseStatus;
    document_url?: string | null;
    signed_document_url?: string | null;
    sent_at?: string | null;
    signed_at?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
    // joins
    po_number?: string;
    provider_name?: string;
}

export type CreateReleaseDocumentInput = Omit<
    ReleaseDocument,
    | 'id'
    | 'release_number'
    | 'release_year'
    | 'release_month'
    | 'release_sequence'
    | 'status'
    | 'document_url'
    | 'signed_document_url'
    | 'sent_at'
    | 'signed_at'
    | 'created_at'
    | 'updated_at'
    | 'po_number'
    | 'provider_name'
>;
