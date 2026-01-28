export type DocumentType = 'RUT' | 'Camara_Comercio' | 'Cedula_Rep_Legal' | 'Cert_Bancaria' | 'Poliza' | 'Habeas_Data' | 'Release_Document' | 'Soporte_Seguridad_Social';
export type DocumentStatus = 'en_revision' | 'aprobado' | 'rechazado' | 'vencido';
export type PersonType = 'natural' | 'juridica';
export type IdentificationDocumentType = 'nit' | 'cedula_ciudadania' | 'cedula_extranjeria' | 'pasaporte';
export type OnboardingStatus = 'EN REVISION' | 'DEVUELTO' | 'VALIDADO';

export interface Provider {
    id: string;
    user_id: string | null;
    business_name: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
    is_client: boolean;
    is_provider: boolean;
    person_type: PersonType | null;
    document_type: IdentificationDocumentType | null;
    document_number: string | null;
    billing_email: string | null;
    address: string | null;
    city: string | null;
    department: string | null;
    country: string | null;
    onboarding_status: OnboardingStatus;
    onboarding_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateProviderInput {
    business_name: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    is_client?: boolean;
    is_provider?: boolean;
    person_type?: PersonType;
    document_type?: IdentificationDocumentType;
    document_number?: string;
    billing_email?: string;
    address?: string;
    city?: string;
    department?: string;
    country?: string;
    onboarding_status?: OnboardingStatus;
    onboarding_notes?: string;
}

export interface ProviderDocument {
    id: string;
    provider_id: string;
    tipo_documento: DocumentType;
    archivo_url: string;
    fecha_expedicion: string | null;
    fecha_vencimiento: string | null;
    estado: DocumentStatus;
    created_at: string;
    updated_at: string;
}
