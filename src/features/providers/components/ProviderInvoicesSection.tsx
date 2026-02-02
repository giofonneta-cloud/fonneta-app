'use client';

import { useState, useEffect } from 'react';
import { useProviderProfile } from '../hooks/useProviderProfile';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { ProviderInvoice, InvoiceStatus } from '../types/provider.types';
import { Loader2, FileText, Download, Plus, Clock, CheckCircle, XCircle, DollarSign, Eye, Edit2, RotateCcw, MessageSquare, X } from 'lucide-react';
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
    },
    'devuelto': {
        icon: RotateCcw,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-100',
        label: 'Devuelto'
    }
};

export function ProviderInvoicesSection() {
    const { provider, isLoading: profileLoading } = useProviderProfile();
    const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<ProviderInvoice | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

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
            {/* Invoices Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Radicado</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Factura #</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Concepto</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
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
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => {
                                    const statusConfig = STATUS_CONFIG[invoice.status];
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                    {invoice.radicado_number || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {invoice.invoice_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {invoice.invoice_type === 'factura' ? 'Factura' : 'Cuenta de Cobro'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 max-w-xs truncate" title={invoice.concept}>
                                                    {invoice.concept}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900">
                                                ${invoice.amount.toLocaleString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                {new Date(invoice.issue_date).toLocaleDateString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${statusConfig.bg} rounded-full`}>
                                                        <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                                        <span className={`text-xs font-bold ${statusConfig.color}`}>
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>
                                                    {invoice.admin_notes && (
                                                        <p className="text-[10px] text-orange-600 font-bold max-w-[200px] leading-tight">
                                                            {invoice.admin_notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Ver detalles */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInvoice(invoice);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                                                    </button>

                                                    {/* Editar (solo si devuelto) */}
                                                    {invoice.status === 'devuelto' && (
                                                        <Link
                                                            href={`/portal/invoices/edit/${invoice.id}`}
                                                            className="p-2 hover:bg-orange-50 border border-transparent hover:border-orange-200 rounded-lg transition-all"
                                                            title="Editar y corregir"
                                                        >
                                                            <Edit2 className="w-4 h-4 text-orange-500 hover:text-orange-600" />
                                                        </Link>
                                                    )}

                                                    {/* Descargar documento */}
                                                    {invoice.document_url && (
                                                        <a
                                                            href={invoice.document_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all"
                                                            title="Descargar PDF"
                                                        >
                                                            <Download className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles */}
            {showDetailsModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    Detalle de Factura
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Radicado: <span className="font-bold text-blue-600">{selectedInvoice.radicado_number || 'N/A'}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedInvoice(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Info básica */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Número de Factura</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedInvoice.invoice_number}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Tipo</p>
                                    <p className="text-lg font-medium text-gray-700">
                                        {selectedInvoice.invoice_type === 'factura' ? 'Factura' : 'Cuenta de Cobro'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Monto</p>
                                    <p className="text-lg font-black text-green-600">
                                        ${selectedInvoice.amount.toLocaleString('es-CO')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Estado</p>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${STATUS_CONFIG[selectedInvoice.status].bg} ${STATUS_CONFIG[selectedInvoice.status].border} border rounded-full mt-1`}>
                                        {(() => {
                                            const StatusIcon = STATUS_CONFIG[selectedInvoice.status].icon;
                                            return <StatusIcon className={`w-3 h-3 ${STATUS_CONFIG[selectedInvoice.status].color}`} />;
                                        })()}
                                        <span className={`text-xs font-black uppercase ${STATUS_CONFIG[selectedInvoice.status].color}`}>
                                            {STATUS_CONFIG[selectedInvoice.status].label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Concepto */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Concepto</p>
                                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{selectedInvoice.concept}</p>
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Fecha de Emisión</p>
                                    <p className="text-gray-700">{new Date(selectedInvoice.issue_date).toLocaleDateString('es-CO')}</p>
                                </div>
                                {selectedInvoice.due_date && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Fecha de Vencimiento</p>
                                        <p className="text-gray-700">{new Date(selectedInvoice.due_date).toLocaleDateString('es-CO')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Documentos adjuntos */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold mb-3">Documentos Adjuntos</p>
                                <div className="space-y-2">
                                    {selectedInvoice.document_url && (
                                        <a
                                            href={selectedInvoice.document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            <span className="font-medium text-gray-700">Factura / Cuenta de Cobro</span>
                                            <Download className="w-4 h-4 text-gray-400 ml-auto" />
                                        </a>
                                    )}
                                    {selectedInvoice.orden_compra_url && (
                                        <a
                                            href={selectedInvoice.orden_compra_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-purple-500" />
                                            <span className="font-medium text-gray-700">Orden de Compra</span>
                                            <Download className="w-4 h-4 text-gray-400 ml-auto" />
                                        </a>
                                    )}
                                    {selectedInvoice.seguridad_social_url && (
                                        <a
                                            href={selectedInvoice.seguridad_social_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-green-500" />
                                            <span className="font-medium text-gray-700">Soporte Seguridad Social</span>
                                            <Download className="w-4 h-4 text-gray-400 ml-auto" />
                                        </a>
                                    )}
                                    {selectedInvoice.release_url && (
                                        <a
                                            href={selectedInvoice.release_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-amber-500" />
                                            <span className="font-medium text-gray-700">Release Document</span>
                                            <Download className="w-4 h-4 text-gray-400 ml-auto" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Comentarios del Admin (si existen) */}
                            {selectedInvoice.admin_notes && (
                                <div className={`p-4 rounded-xl ${selectedInvoice.status === 'devuelto' ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
                                    <div className="flex items-start gap-3">
                                        <MessageSquare className={`w-5 h-5 mt-0.5 ${selectedInvoice.status === 'devuelto' ? 'text-orange-500' : 'text-blue-500'}`} />
                                        <div>
                                            <p className={`text-xs uppercase font-bold mb-1 ${selectedInvoice.status === 'devuelto' ? 'text-orange-600' : 'text-blue-600'}`}>
                                                Comentarios del Administrador
                                            </p>
                                            <p className="text-gray-700">{selectedInvoice.admin_notes}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Alerta si está devuelto */}
                            {selectedInvoice.status === 'devuelto' && (
                                <div className="bg-orange-100 border-2 border-orange-300 rounded-xl p-4">
                                    <p className="text-orange-800 font-bold text-sm mb-2">
                                        Esta factura requiere corrección
                                    </p>
                                    <p className="text-orange-700 text-sm mb-3">
                                        Por favor revisa los comentarios del administrador y actualiza los documentos necesarios.
                                    </p>
                                    <Link
                                        href={`/portal/invoices/edit/${selectedInvoice.id}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editar y Corregir
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedInvoice(null);
                                }}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
