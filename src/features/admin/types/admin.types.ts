// Tipos para el módulo de administración

export interface SystemConfig {
    id: string;
    module_name: string;
    display_name: string | null;
    description: string | null;
    is_active: boolean;
    is_core: boolean;
    config_data: Record<string, unknown>;
    affected_roles: string[];
    updated_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CustomField {
    id: string;
    entity_type: 'project' | 'expense' | 'sale' | 'provider';
    field_name: string;
    field_label: string;
    field_type: CustomFieldType;
    field_config: CustomFieldConfig;
    is_required: boolean;
    is_active: boolean;
    display_order: number;
    visible_in: string[];
    visible_for_roles: string[];
    editable_by_roles: string[];
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

export type CustomFieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'dropdown'
    | 'radio'
    | 'checkbox'
    | 'file'
    | 'url'
    | 'email'
    | 'phone';

export interface CustomFieldConfig {
    options?: { label: string; value: string }[];
    min?: number;
    max?: number;
    placeholder?: string;
    helpText?: string;
    pattern?: string;
    fileTypes?: string[];
    maxFileSize?: number;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    user_email: string | null;
    user_role: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    entity_name: string | null;
    changes: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

// Estadísticas del sistema para el dashboard
export interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    activeProjects: number;
    totalProviders: number;
    activeProviders: number;
    pendingInvoices: number;
    expiringDocuments: number;
    inactiveUsersCount: number;
}

export interface FinancialSummary {
    monthlyRevenue: number;
    monthlyExpenses: number;
    averageMargin: number;
    pendingPayables: number;
    pendingReceivables: number;
    projectsToInvoice: number;
}

export interface AdoptionMetrics {
    projectsInSystem: number;
    projectsTarget: number;
    providersUsingPortal: number;
    providersTotal: number;
    autoRegisteredExpenses: number;
    totalExpenses: number;
    avgInvoiceApprovalDays: number;
}

export interface AdminAlert {
    id: string;
    type: 'warning' | 'info' | 'error';
    title: string;
    description: string;
    link?: string;
    count?: number;
    createdAt: string;
}
