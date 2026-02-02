'use client';

import { useState, useEffect } from 'react';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { ProviderInvoice, InvoiceStatus } from '../types/provider.types';
import { Loader2, FileText, Download, CheckCircle, XCircle, Clock, DollarSign, Filter } from 'lucide-react';

const STATUS_CONFIG = {
    'pendiente': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pendiente' },
    'en_revision': { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'En Revisión' },
    'aprobado': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Aprobado' },
    'pagado': { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Pagado' },
    'rechazado': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rechazado' }
};

interface InvoiceWithProvider extends ProviderInvoice {
    provider?: {
        id: string;
        business_name: string;
        document_type: string;
        document_number: string;
    };
}

export function AdminInvoicesView() {
    const [invoices, setInvoices] = useState<InvoiceWithProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithProvider | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateData, setUpdateData] = useState({
        status: 'pendiente' as InvoiceStatus,
        admin_notes: '',
        payment_date: ''
    });

    useEffect(() => {
        loadInvoices();
    }, []);

    useEffect(() => {
        if (selectedInvoice) {
            setUpdateData({
                status: selectedInvoice.status,
                admin_notes: selectedInvoice.admin_notes || '',
                payment_date: selectedInvoice.payment_date || ''
            });
        }
    }, [selectedInvoice]);

    const loadInvoices = async () => {
        try {
            setIsLoading(true);
            const data = await providerInvoiceService.getAllInvoices();
            setInvoices(data as InvoiceWithProvider[]);
        } catch (err: any) {
            console.error('Error al cargar facturas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedInvoice) return;

        setIsUpdating(true);
        try {
            await providerInvoiceService.updateInvoiceStatus(
                selectedInvoice.id,
                updateData.status,
                updateData.admin_notes || undefined,
                updateData.payment_date || undefined
            );
            await loadInvoices();
            setSelectedInvoice(null);
        } catch (err: any) {
            console.error('Error al actualizar factura:', err);
            alert('Error al actualizar factura');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
        const matchesSearch = !searchTerm ||
            invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.provider?.business_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900">Gestión de Facturas</h1>
                <p className="text-gray-500 font-medium mt-1">
                    Administra las facturas y cuentas de cobro de todos los proveedores
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">Buscar</label>
                        <input
                            type="text"
                            placeholder="Número de factura o proveedor..."
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">Estado</label>
                        <select
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | 'all')}
                        >
                            <option value="all">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_revision">En Revisión</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="pagado">Pagado</option>
                            <option value="rechazado">Rechazado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(['all', 'pendiente', 'en_revision', 'aprobado', 'pagado'] as const).map((status) => {
                    const count = status === 'all' ? invoices.length : invoices.filter(i => i.status === status).length;
                    const config = status === 'all'
                        ? { label: 'Total', color: 'text-gray-600' }
                        : STATUS_CONFIG[status];

                    return (
                        <div key={status} className="bg-white p-4 rounded-xl border border-gray-100">
                            <div className={`text-2xl font-black ${config.color}`}>{count}</div>
                            <div className="text-sm text-gray-600 font-medium mt-1">{config.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Número</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron facturas
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => {
                                    const statusConfig = STATUS_CONFIG[invoice.status];
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={invoice.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{invoice.provider?.business_name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {invoice.provider?.document_type?.toUpperCase()} {invoice.provider?.document_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoice_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {invoice.invoice_type === 'factura' ? 'Factura' : 'Cuenta Cobro'}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                ${invoice.amount.toLocaleString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(invoice.issue_date).toLocaleDateString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 ${statusConfig.bg} rounded-full`}>
                                                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                                    <span className={`text-xs font-bold ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedInvoice(invoice)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-all text-blue-600"
                                                        title="Gestionar"
                                                    >
                                                        <Filter className="w-4 h-4" />
                                                    </button>
                                                    {invoice.document_url && (
                                                        <a
                                                            href={invoice.document_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-gray-50 rounded-lg transition-all text-gray-600"
                                                            title="Descargar PDF"
                                                        >
                                                            <Download className="w-4 h-4" />
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

            {/* Update Modal */}
            {selectedInvoice && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedInvoice(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-black text-gray-900 mb-6">
                            Gestionar Factura {selectedInvoice.invoice_number}
                        </h2>

                        <div className="space-y-6">
                            {/* Proveedor Info */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="text-sm font-bold text-gray-700">Proveedor</div>
                                <div className="text-lg font-bold text-gray-900 mt-1">
                                    {selectedInvoice.provider?.business_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {selectedInvoice.provider?.document_type?.toUpperCase()} {selectedInvoice.provider?.document_number}
                                </div>
                            </div>

                            {/* Invoice Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-bold text-gray-700">Monto</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        ${selectedInvoice.amount.toLocaleString('es-CO')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-700">Fecha Emisión</div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {new Date(selectedInvoice.issue_date).toLocaleDateString('es-CO')}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-bold text-gray-700 mb-2">Concepto</div>
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                                    {selectedInvoice.concept}
                                </div>
                            </div>

                            {/* Update Form */}
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">Estado</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                                    value={updateData.status}
                                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value as InvoiceStatus })}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="en_revision">En Revisión</option>
                                    <option value="aprobado">Aprobado</option>
                                    <option value="pagado">Pagado</option>
                                    <option value="rechazado">Rechazado</option>
                                </select>
                            </div>

                            {updateData.status === 'pagado' && (
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">Fecha de Pago</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                                        value={updateData.payment_date}
                                        onChange={(e) => setUpdateData({ ...updateData, payment_date: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">Notas Administrativas</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium resize-none"
                                    placeholder="Agrega notas visibles para el proveedor..."
                                    value={updateData.admin_notes}
                                    onChange={(e) => setUpdateData({ ...updateData, admin_notes: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    disabled={isUpdating}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={isUpdating}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Actualizando...
                                        </>
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
