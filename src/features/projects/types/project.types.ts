export type ProjectStatus = 'brief' | 'diseno' | 'aprobacion' | 'produccion' | 'completado' | 'facturado';

export interface Project {
    id: string;
    name: string;
    client: string;
    client_id: string | null;
    service_type: string | null;
    status: ProjectStatus;
    budget_income: number | null;
    budget_income_currency: string;
    budget_expense: number | null;
    budget_expense_currency: string;
    start_date: string | null;
    deadline: string | null;
    pm_id: string | null;
    created_at: string;
    updated_at: string;

    // Extended fields
    quotation_number?: string;
    items_description?: string;
    net_value?: number;
    total_value_with_tax?: number;
    product_image_url?: string;
    line_of_business?: string;
    brand?: string;
    product_name?: string;
    period?: string;
    pm_name_text?: string; // Campo auxiliar para display
}

export interface ProjectFilters {
    status?: ProjectStatus[];
    client?: string;
    service_type?: string;
    pm_id?: string;
    search?: string;
}
