'use client';

import type { FinancialSummary } from '../types/admin.types';

interface Props {
    summary: FinancialSummary;
}

export function FinancialSummaryCard({ summary }: Props) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const marginColor = summary.averageMargin >= 25
        ? 'text-emerald-600'
        : summary.averageMargin >= 15
            ? 'text-amber-600'
            : 'text-red-600';

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    Resumen Financiero
                </h3>
                <span className="text-sm text-gray-500">Este mes</span>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-emerald-600 font-medium">Ingresos</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                        {formatCurrency(summary.monthlyRevenue)}
                    </p>
                </div>
                <div className="bg-rose-50 rounded-lg p-4">
                    <p className="text-sm text-rose-600 font-medium">Gastos</p>
                    <p className="text-xl font-bold text-rose-700 mt-1">
                        {formatCurrency(summary.monthlyExpenses)}
                    </p>
                </div>
            </div>

            {/* Margen */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Margen promedio</span>
                    <span className={`text-2xl font-bold ${marginColor}`}>
                        {summary.averageMargin.toFixed(1)}%
                    </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${summary.averageMargin >= 25
                                ? 'bg-emerald-500'
                                : summary.averageMargin >= 15
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                            }`}
                        style={{ width: `${Math.min(summary.averageMargin, 100)}%` }}
                    />
                </div>
            </div>

            {/* Pendientes */}
            <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-sm text-gray-600">Por cobrar</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                        {formatCurrency(summary.pendingReceivables)}
                    </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-sm text-gray-600">Por pagar</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                        {formatCurrency(summary.pendingPayables)}
                    </span>
                </div>
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="text-sm text-gray-600">Proyectos por facturar</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                        {summary.projectsToInvoice}
                    </span>
                </div>
            </div>
        </div>
    );
}
