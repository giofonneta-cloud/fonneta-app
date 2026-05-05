import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { providerService } from '../services/providerService';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { Provider } from '../types/provider.types';

interface ProviderStats {
    onboarding_status: 'EN REVISION' | 'DEVUELTO' | 'VALIDADO';
    pending_documents: number;
    expiring_soon_documents: number;
    pending_invoices: number;
    total_invoiced_month: number;
    total_invoiced_year: number;
    pending_purchase_orders: number;
}

export function useProviderProfile() {
    const [provider, setProvider] = useState<Provider | null>(null);
    const [stats, setStats] = useState<ProviderStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProviderData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Obtener usuario directamente de Supabase (más confiable que authStore)
                const supabase = createClient();
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    setIsLoading(false);
                    return;
                }

                // 1. Obtener datos del proveedor (busca por user_id, fallback por email)
                const providerData = await providerService.getProviderByUserId(user.id, user.email);
                setProvider(providerData);

                // 2. Obtener documentos
                const documents = await providerService.getProviderDocuments(providerData.id);
                const pending_docs = documents.filter(d => d.estado === 'en_revision').length;
                const expiring_soon = documents.filter(d => {
                    if (!d.fecha_vencimiento) return false;
                    const daysUntilExpiry = Math.ceil(
                        (new Date(d.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                }).length;

                // 3. Obtener estadísticas de facturación y OCs
                const [invoiceStats, pendingOCs] = await Promise.all([
                    providerInvoiceService.getInvoiceStats(providerData.id),
                    providerService.getPendingPurchaseOrdersCount(providerData.id),
                ]);

                setStats({
                    onboarding_status: providerData.onboarding_status,
                    pending_documents: pending_docs,
                    expiring_soon_documents: expiring_soon,
                    pending_invoices: invoiceStats.pending_count + invoiceStats.approved_count,
                    total_invoiced_month: invoiceStats.total_current_month,
                    total_invoiced_year: invoiceStats.total_current_year,
                    pending_purchase_orders: pendingOCs,
                });

            } catch (err: any) {
                console.error('Error al cargar datos del proveedor:', err);
                setError(err.message || 'Error al cargar información');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProviderData();
    }, []);

    return { provider, stats, isLoading, error };
}
