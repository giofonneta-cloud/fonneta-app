'use client';

import type { AdoptionMetrics } from '../types/admin.types';

interface Props {
    metrics: AdoptionMetrics;
}

export function AdoptionMetricsCard({ metrics }: Props) {
    const projectsPercentage = metrics.projectsTarget > 0
        ? (metrics.projectsInSystem / metrics.projectsTarget) * 100
        : 0;

    const providersPercentage = metrics.providersTotal > 0
        ? (metrics.providersUsingPortal / metrics.providersTotal) * 100
        : 0;

    const autoExpensesPercentage = metrics.totalExpenses > 0
        ? (metrics.autoRegisteredExpenses / metrics.totalExpenses) * 100
        : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Métricas de Adopción
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Proyectos registrados */}
                <MetricItem
                    title="Proyectos en Sistema"
                    value={metrics.projectsInSystem}
                    target={metrics.projectsTarget}
                    percentage={projectsPercentage}
                    unit="proyectos"
                />

                {/* Proveedores usando portal */}
                <MetricItem
                    title="Proveedores con Portal"
                    value={metrics.providersUsingPortal}
                    target={metrics.providersTotal}
                    percentage={providersPercentage}
                    unit="proveedores"
                />

                {/* Gastos auto-registrados */}
                <MetricItem
                    title="Gastos Auto-registrados"
                    value={metrics.autoRegisteredExpenses}
                    target={metrics.totalExpenses}
                    percentage={autoExpensesPercentage}
                    unit="gastos"
                />
            </div>

            {/* Tiempo promedio de aprobación */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Tiempo promedio de aprobación de facturas</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {metrics.avgInvoiceApprovalDays} días
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${metrics.avgInvoiceApprovalDays <= 3
                            ? 'bg-emerald-100 text-emerald-700'
                            : metrics.avgInvoiceApprovalDays <= 7
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                        {metrics.avgInvoiceApprovalDays <= 3 ? 'Excelente' :
                            metrics.avgInvoiceApprovalDays <= 7 ? 'Regular' : 'Lento'}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MetricItemProps {
    title: string;
    value: number;
    target: number;
    percentage: number;
    unit: string;
}

function MetricItem({ title, value, target, percentage, unit }: MetricItemProps) {
    const getColor = () => {
        if (percentage >= 80) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-sm text-gray-500">/ {target} {unit}</span>
            </div>
            <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progreso</span>
                    <span className="font-medium text-gray-700">{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${getColor()}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
