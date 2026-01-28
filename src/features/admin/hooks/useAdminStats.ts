// Hook para obtener estadísticas del dashboard de administrador

import { useState, useEffect, useCallback } from 'react';
import {
    getSystemStats,
    getFinancialSummary,
    getAdoptionMetrics,
    getAdminAlerts,
} from '../services/adminService';
import type {
    SystemStats,
    FinancialSummary,
    AdoptionMetrics,
    AdminAlert,
} from '../types/admin.types';

interface UseAdminStatsResult {
    systemStats: SystemStats | null;
    financialSummary: FinancialSummary | null;
    adoptionMetrics: AdoptionMetrics | null;
    alerts: AdminAlert[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useAdminStats(): UseAdminStatsResult {
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
    const [adoptionMetrics, setAdoptionMetrics] = useState<AdoptionMetrics | null>(null);
    const [alerts, setAlerts] = useState<AdminAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [stats, financial, adoption, adminAlerts] = await Promise.all([
                getSystemStats(),
                getFinancialSummary(),
                getAdoptionMetrics(),
                getAdminAlerts(),
            ]);

            setSystemStats(stats);
            setFinancialSummary(financial);
            setAdoptionMetrics(adoption);
            setAlerts(adminAlerts);
        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError('Error al cargar estadísticas del sistema');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return {
        systemStats,
        financialSummary,
        adoptionMetrics,
        alerts,
        isLoading,
        error,
        refresh: fetchAll,
    };
}
