import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
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
}

export function useProviderProfile() {
    const { profile } = useAuthStore();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [stats, setStats] = useState<ProviderStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProviderData = async () => {
            if (!profile?.id) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // 1. Obtener datos del proveedor
                const providerData = await providerService.getProviderByUserId(profile.id);
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

                // 3. Obtener estadísticas de facturación
                const invoiceStats = await providerInvoiceService.getInvoiceStats(providerData.id);

                setStats({
                    onboarding_status: providerData.onboarding_status,
                    pending_documents: pending_docs,
                    expiring_soon_documents: expiring_soon,
                    pending_invoices: invoiceStats.pending_count + invoiceStats.approved_count,
                    total_invoiced_month: invoiceStats.total_current_month,
                    total_invoiced_year: invoiceStats.total_current_year
                });

            } catch (err: any) {
                console.error('Error al cargar datos del proveedor:', err);
                setError(err.message || 'Error al cargar información');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProviderData();
    }, [profile?.id]);

    return { provider, stats, isLoading, error };
}
