'use client';

import { useAdminStats } from '../hooks/useAdminStats';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { SystemHealthCard } from './SystemHealthCard';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { AlertsCard } from './AlertsCard';
import { AdoptionMetricsCard } from './AdoptionMetricsCard';
import { QuickActionsCard } from './QuickActionsCard';

export function AdminDashboard() {
    const {
        systemStats,
        financialSummary,
        adoptionMetrics,
        alerts,
        isLoading,
        error,
        refresh,
    } = useAdminStats();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 font-medium">{error}</p>
                <button
                    onClick={refresh}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <RoleGuard
            allowedRoles={['admin']}
            fallback={
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-700 font-medium">
                        No tienes permisos para acceder al panel de administración
                    </p>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Panel de Administración
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Resumen del estado del sistema
                        </p>
                    </div>
                    <button
                        onClick={refresh}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                    </button>
                </div>

                {/* Alertas */}
                {alerts.length > 0 && (
                    <AlertsCard alerts={alerts} />
                )}

                {/* Primera fila: Stats principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {systemStats && (
                        <>
                            <StatCard
                                label="Usuarios Activos"
                                value={systemStats.activeUsers}
                                total={systemStats.totalUsers}
                                icon="users"
                                color="indigo"
                            />
                            <StatCard
                                label="Proyectos Activos"
                                value={systemStats.activeProjects}
                                total={systemStats.totalProjects}
                                icon="folder"
                                color="emerald"
                            />
                            <StatCard
                                label="Proveedores"
                                value={systemStats.activeProviders}
                                total={systemStats.totalProviders}
                                icon="building"
                                color="amber"
                            />
                            <StatCard
                                label="Facturas Pendientes"
                                value={systemStats.pendingInvoices}
                                icon="document"
                                color="rose"
                            />
                        </>
                    )}
                </div>

                {/* Segunda fila: Cards detallados */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {systemStats && <SystemHealthCard stats={systemStats} />}
                    {financialSummary && <FinancialSummaryCard summary={financialSummary} />}
                </div>

                {/* Tercera fila: Métricas y acciones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {adoptionMetrics && <AdoptionMetricsCard metrics={adoptionMetrics} />}
                    <QuickActionsCard />
                </div>
            </div>
        </RoleGuard>
    );
}

// Componente auxiliar para stats rápidos
interface StatCardProps {
    label: string;
    value: number;
    total?: number;
    icon: 'users' | 'folder' | 'building' | 'document';
    color: 'indigo' | 'emerald' | 'amber' | 'rose';
}

function StatCard({ label, value, total, icon, color }: StatCardProps) {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        amber: 'bg-amber-50 text-amber-600 border-amber-200',
        rose: 'bg-rose-50 text-rose-600 border-rose-200',
    };

    const iconPaths: Record<string, string> = {
        users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
        building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };

    return (
        <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-80">{label}</p>
                    <p className="text-3xl font-bold mt-1">
                        {value}
                        {total !== undefined && (
                            <span className="text-lg font-normal opacity-60">/{total}</span>
                        )}
                    </p>
                </div>
                <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[icon]} />
                </svg>
            </div>
        </div>
    );
}
