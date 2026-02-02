'use client';

import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface ProviderStats {
    onboarding_status: 'EN REVISION' | 'DEVUELTO' | 'VALIDADO';
    pending_documents: number;
    expiring_soon_documents: number;
    pending_invoices: number;
    total_invoiced_month: number;
    total_invoiced_year: number;
}

interface Props {
    stats: ProviderStats;
}

export function ProviderStatsCards({ stats }: Props) {
    const statusConfig = {
        'EN REVISION': {
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            border: 'border-yellow-100',
            label: 'En Revisión'
        },
        'DEVUELTO': {
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            label: 'Devuelto'
        },
        'VALIDADO': {
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
            label: 'Validado'
        }
    };

    const status = statusConfig[stats.onboarding_status];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Estado de Validación */}
            <div className={`p-6 ${status.bg} border ${status.border} rounded-2xl`}>
                <div className="flex items-center justify-between mb-4">
                    <CheckCircle className={`w-8 h-8 ${status.color}`} />
                    <span className={`px-3 py-1 ${status.bg} ${status.color} text-xs font-black uppercase tracking-wider rounded-full`}>
                        Estado
                    </span>
                </div>
                <h3 className={`text-2xl font-black ${status.color} mb-1`}>
                    {status.label}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                    Estado de tu registro
                </p>
            </div>

            {/* Documentos Pendientes */}
            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-black uppercase tracking-wider rounded-full">
                        Docs
                    </span>
                </div>
                <h3 className="text-2xl font-black text-blue-600 mb-1">
                    {stats.pending_documents}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                    Documentos pendientes
                </p>
                {stats.expiring_soon_documents > 0 && (
                    <p className="text-xs text-orange-600 font-bold mt-2">
                        {stats.expiring_soon_documents} próximos a vencer
                    </p>
                )}
            </div>

            {/* Facturas Pendientes */}
            <div className="p-6 bg-purple-50/50 border border-purple-100 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <Clock className="w-8 h-8 text-purple-600" />
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-black uppercase tracking-wider rounded-full">
                        Facturas
                    </span>
                </div>
                <h3 className="text-2xl font-black text-purple-600 mb-1">
                    {stats.pending_invoices}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                    Facturas pendientes de pago
                </p>
            </div>

            {/* Total Facturado */}
            <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-wider rounded-full">
                        Total
                    </span>
                </div>
                <h3 className="text-2xl font-black text-emerald-600 mb-1">
                    ${stats.total_invoiced_month.toLocaleString('es-CO')}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                    Facturado este mes
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                    Año: ${stats.total_invoiced_year.toLocaleString('es-CO')}
                </p>
            </div>
        </div>
    );
}
