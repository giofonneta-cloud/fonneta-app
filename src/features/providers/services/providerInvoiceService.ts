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
                valor_neto: input.valor_neto,
                iva_porcentaje: input.iva_porcentaje,
                iva_valor: input.iva_valor,
                total_con_iva: input.total_con_iva,
                plazo_pago: input.plazo_pago || 60,
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
        paymentDate?: string,
        projectId?: string | null,
        categoria?: string | null,
        plazoPago?: number
    ) {
        const updateData: Partial<ProviderInvoice> = {
            status,
            admin_notes: adminNotes || null,
            project_id: projectId || null,
            categoria: categoria || null,
            plazo_pago: plazoPago ?? 60,
            updated_at: new Date().toISOString()
        };

        // Si el estado es "pagado", agregar fecha de pago
        if (status === 'pagado') {
            updateData.payment_date = paymentDate || new Date().toISOString().split('T')[0];
        }

        // 1. Actualizar la factura primero para tener los datos frescos
        const { data: invoice, error: updateError } = await supabase
            .from('provider_invoices')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) throw updateError;
        const updatedInvoice = invoice as ProviderInvoice;

        // 3. Enviar notificación de cambio de estado
        try {
            // Email Notification (Server-side API)
            await fetch('/api/providers/invoice-status-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: updatedInvoice.id,
                    providerId: updatedInvoice.provider_id,
                    invoiceNumber: updatedInvoice.invoice_number,
                    radicadoNumber: updatedInvoice.radicado_number || 'PENDIENTE',
                    newStatus: status,
                    adminNotes: adminNotes
                })
            });

            // In-App Notification (Client-side directly to DB)
            // First we need the user_id of the provider to send the notification
            const { data: providerData } = await supabase
                .from('providers')
                .select('user_id')
                .eq('id', updatedInvoice.provider_id)
                .single();

            if (providerData?.user_id) {
                const { notificationService } = await import('@/shared/services/notificationService');
                const statusLabels: Record<string, string> = {
                    'pendiente': 'Pendiente',
                    'en_revision': 'En Revisión',
                    'aprobado': 'Aprobado',
                    'pagado': 'Pagado',
                    'rechazado': 'Rechazado',
                    'devuelto': 'Devuelto'
                };

                await notificationService.createNotification({
                    user_id: providerData.user_id,
                    type: 'invoice_update',
                    title: `Factura ${statusLabels[status] || status}`,
                    message: `Tu factura #${updatedInvoice.invoice_number} ha cambiado de estado a: ${statusLabels[status] || status}.`,
                    data: {
                        invoice_id: updatedInvoice.id,
                        status: status
                    }
                });
            }

        } catch (notifyError) {
            console.error('Error enviando notificación:', notifyError);
            // No bloqueamos el flujo si falla la notificación
        }

        // 2. Si se aprueba y NO tiene gasto vinculado, crear el Gasto
        if (status === 'aprobado' && !updatedInvoice.expense_id && updatedInvoice.project_id) {
            try {
                const { expensesService } = await import('@/features/finance/services/expensesService');
                
                const gasto = await expensesService.createGasto({
                    proyecto_id: updatedInvoice.project_id,
                    proveedor_id: updatedInvoice.provider_id,
                    valor_neto: updatedInvoice.valor_neto,
                    iva_porcentaje: updatedInvoice.iva_porcentaje,
                    iva_valor: updatedInvoice.iva_valor,
                    total_con_iva: updatedInvoice.total_con_iva,
                    categoria: updatedInvoice.categoria || 'pendiente',
                    numero_factura_proveedor: updatedInvoice.invoice_number,
                    factura_url: updatedInvoice.document_url || undefined,
                    fecha_radicado: new Date().toISOString().split('T')[0],
                    // Calcular fecha límite de pago basado en plazo_pago
                    fecha_limite_pago: new Date(Date.now() + (updatedInvoice.plazo_pago || 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    estado_pago: 'pendiente',
                    observaciones: `[AUTO] Generado desde Radicado ${updatedInvoice.radicado_number}. ${updatedInvoice.admin_notes || ''}`
                } as any);

                if (gasto?.id) {
                    await supabase
                        .from('provider_invoices')
                        .update({ expense_id: gasto.id })
                        .eq('id', id);
                }
            } catch (gastoError) {
                console.error('Error creando gasto automático:', gastoError);
                // No bloqueamos el update de la factura, pero logueamos el error
            }
        }

        return updatedInvoice;
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
