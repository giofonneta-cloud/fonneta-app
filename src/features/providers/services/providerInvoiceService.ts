import { supabase } from '@/shared/lib/supabase';
import {
    ProviderInvoice,
    CreateInvoiceInput,
    UpdateInvoiceInput,
    InvoiceStatus
} from '../types/provider.types';

export const providerInvoiceService = {
    /**
     * Crear nueva factura/cuenta de cobro
     */
    async createInvoice(input: CreateInvoiceInput) {
        const { data, error } = await supabase
            .from('provider_invoices')
            .insert([{
                provider_id: input.provider_id,
                invoice_number: input.invoice_number,
                invoice_type: input.invoice_type,
                issue_date: input.issue_date,
                due_date: input.due_date || null,
                amount: input.amount,
                concept: input.concept,
                document_url: input.document_url || null,
                orden_compra_url: input.orden_compra_url || null,
                seguridad_social_url: input.seguridad_social_url || null,
                release_url: input.release_url || null,
                status: 'pendiente'
            }])
            .select()
            .single();

        if (error) throw error;
        return data as ProviderInvoice;
    },

    /**
     * Obtener todas las facturas de un proveedor
     */
    async getInvoicesByProvider(providerId: string) {
        const { data, error } = await supabase
            .from('provider_invoices')
            .select('*')
            .eq('provider_id', providerId)
            .order('issue_date', { ascending: false });

        if (error) throw error;
        return data as ProviderInvoice[];
    },

    /**
     * Obtener todas las facturas (admin/administrativo)
     */
    async getAllInvoices() {
        const { data, error } = await supabase
            .from('provider_invoices')
            .select(`
                *,
                provider:providers(
                    id,
                    business_name,
                    document_type,
                    document_number
                )
            `)
            .order('issue_date', { ascending: false });

        if (error) throw error;
        return data as ProviderInvoice[];
    },

    /**
     * Obtener factura por ID
     */
    async getInvoiceById(id: string) {
        const { data, error } = await supabase
            .from('provider_invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as ProviderInvoice;
    },

    /**
     * Actualizar factura (proveedor actualiza datos, admin actualiza todo)
     */
    async updateInvoice(id: string, input: UpdateInvoiceInput) {
        const { data, error } = await supabase
            .from('provider_invoices')
            .update({
                ...input,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ProviderInvoice;
    },

    /**
     * Cambiar estado de factura (solo admin/administrativo)
     */
    async updateInvoiceStatus(
        id: string,
        status: InvoiceStatus,
        adminNotes?: string,
        paymentDate?: string
    ) {
        const updateData: Partial<ProviderInvoice> = {
            status,
            admin_notes: adminNotes || null,
            updated_at: new Date().toISOString()
        };

        // Si el estado es "pagado", agregar fecha de pago
        if (status === 'pagado') {
            updateData.payment_date = paymentDate || new Date().toISOString().split('T')[0];
        }

        const { data, error } = await supabase
            .from('provider_invoices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ProviderInvoice;
    },

    /**
     * Eliminar factura (solo admin)
     */
    async deleteInvoice(id: string) {
        const { error } = await supabase
            .from('provider_invoices')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Subir documento PDF de factura via API Route
     */
    async uploadInvoiceDocument(providerId: string, invoiceNumber: string, file: File, amount?: number) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('providerId', providerId);
            formData.append('invoiceNumber', invoiceNumber);
            if (amount) {
                formData.append('amount', amount.toString());
            }

            const response = await fetch('/api/upload/provider-invoice', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al subir la factura');
            }

            const result = await response.json();
            return result.fileUrl as string;
        } catch (error) {
            console.error('Error uploading invoice:', error);
            throw error;
        }
    },

    /**
     * Obtener estadísticas de facturación por proveedor
     */
    async getInvoiceStats(providerId: string) {
        const { data, error } = await supabase
            .from('provider_invoices')
            .select('amount, status, issue_date')
            .eq('provider_id', providerId);

        if (error) throw error;

        const invoices = data as ProviderInvoice[];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const stats = {
            total_pending: invoices
                .filter(inv => inv.status === 'pendiente' || inv.status === 'en_revision' || inv.status === 'aprobado')
                .reduce((sum, inv) => sum + inv.amount, 0),
            total_paid: invoices
                .filter(inv => inv.status === 'pagado')
                .reduce((sum, inv) => sum + inv.amount, 0),
            total_current_month: invoices
                .filter(inv => {
                    const issueDate = new Date(inv.issue_date);
                    return issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear;
                })
                .reduce((sum, inv) => sum + inv.amount, 0),
            total_current_year: invoices
                .filter(inv => new Date(inv.issue_date).getFullYear() === currentYear)
                .reduce((sum, inv) => sum + inv.amount, 0),
            pending_count: invoices.filter(inv => inv.status === 'pendiente' || inv.status === 'en_revision').length,
            approved_count: invoices.filter(inv => inv.status === 'aprobado').length,
            paid_count: invoices.filter(inv => inv.status === 'pagado').length
        };

        return stats;
    }
};
