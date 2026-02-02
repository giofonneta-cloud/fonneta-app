'use client';

import { useState, useEffect } from 'react';
import { useProviderProfile } from '../hooks/useProviderProfile';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { ProviderInvoice, InvoiceStatus } from '../types/provider.types';
import { Loader2, FileText, Download, Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
    'pendiente': {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-100',
        label: 'Pendiente'
    },
    'en_revision': {
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        label: 'En Revisión'
    },
    'aprobado': {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-100',
        label: 'Aprobado'
    },
    'pagado': {
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        label: 'Pagado'
    },
    'rechazado': {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-100',
        label: 'Rechazado'
    }
};

export function ProviderInvoicesSection() {
    const { provider, isLoading: profileLoading } = useProviderProfile();
    const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

    useEffect(() => {
        if (provider) {
            loadInvoices();
        }
    }, [provider]);

    const loadInvoices = async () => {
        if (!provider) return;

        try {
            setIsLoading(true);
            const data = await providerInvoiceService.getInvoicesByProvider(provider.id);
            setInvoices(data);
        } catch (err: any) {
            console.error('Error al cargar facturas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredInvoices = filterStatus === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === filterStatus);

    if (profileLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Mis Facturas</h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Gestiona tus facturas y cuentas de cobro
                    </p>
                </div>
                <Link
                    href="/portal/invoices/new"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Factura
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['all', 'pendiente', 'aprobado', 'pagado'].map((status) => {
                    const count = status === 'all'
                        ? invoices.length
                        : invoices.filter(inv => inv.status === status).length;

                    const config = status === 'all'
                        ? { label: 'Total', color: 'text-gray-600', bg: 'bg-gray-50' }
                        : STATUS_CONFIG[status as InvoiceStatus];

                    return (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as InvoiceStatus | 'all')}
                            className={`
                                p-4 rounded-xl border-2 transition-all text-left
                                ${filterStatus === status ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}
                            `}
                        >
                            <div className={`text-2xl font-black ${config.color}`}>{count}</div>
                            <div className="text-sm text-gray-600 font-medium mt-1">{config.label}</div>
                        </button>
                    );
                })}
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
                {filteredInvoices.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                            {filterStatus === 'all'
                                ? 'No has registrado ninguna factura aún'
                                : `No hay facturas con estado "${STATUS_CONFIG[filterStatus as InvoiceStatus].label}"`}
                        </p>
                        {filterStatus === 'all' && (
                            <Link
                                href="/portal/invoices/new"
                                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                            >
                                Registrar Primera Factura
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredInvoices.map((invoice) => {
                        const statusConfig = STATUS_CONFIG[invoice.status];
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={invoice.id}
                                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <FileText className="w-6 h-6 text-blue-500" />
                                            <div>
                                                <h3 className="font-bold text-gray-900">
                                                    {invoice.invoice_number}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {invoice.invoice_type === 'factura' ? 'Factura' : 'Cuenta de Cobro'}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-4">
                                            {invoice.concept}
                                        </p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 font-medium block">Monto</span>
                                                <span className="text-gray-900 font-bold">
                                                    ${invoice.amount.toLocaleString('es-CO')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 font-medium block">Fecha Emisión</span>
                                                <span className="text-gray-900 font-bold">
                                                    {new Date(invoice.issue_date).toLocaleDateString('es-CO')}
                                                </span>
                                            </div>
                                            {invoice.payment_date && (
                                                <div>
                                                    <span className="text-gray-500 font-medium block">Fecha Pago</span>
                                                    <span className="text-gray-900 font-bold">
                                                        {new Date(invoice.payment_date).toLocaleDateString('es-CO')}
                                                    </span>
                                                </div>
                                            )}
                                            {invoice.admin_notes && (
                                                <div className="md:col-span-2">
                                                    <span className="text-gray-500 font-medium block">Notas Admin</span>
                                                    <span className="text-gray-900 font-medium text-xs">
                                                        {invoice.admin_notes}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3 ml-4">
                                        <div className={`flex items-center gap-2 px-3 py-1 ${statusConfig.bg} ${statusConfig.border} border rounded-full`}>
                                            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                            <span className={`text-xs font-black uppercase ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        {invoice.document_url && (
                                            <a
                                                href={invoice.document_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-gray-50 rounded-lg transition-all"
                                                title="Descargar PDF"
                                            >
                                                <Download className="w-5 h-5 text-gray-400" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
