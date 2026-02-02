'use client';

import { useState, useEffect } from 'react';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { ProviderInvoice, InvoiceStatus } from '../types/provider.types';
import { projectService } from '@/features/projects/services/projectService';
import { Project } from '@/features/projects/types/project.types';
import { 
    Loader2, FileText, Download, CheckCircle, XCircle, Clock, 
    DollarSign, Filter, Search, RotateCcw, Eye, MessageSquare, TrendingUp 
} from 'lucide-react';

const STATUS_CONFIG = {
    'pendiente': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pendiente' },
    'en_revision': { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'En Revisión' },
    'aprobado': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Aprobado' },
    'pagado': { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Pagado' },
    'rechazado': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Rechazado' },
    'devuelto': { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Devuelto' }
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
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithProvider | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateData, setUpdateData] = useState({
        status: 'pendiente' as InvoiceStatus,
        admin_notes: '',
        payment_date: '',
        project_id: '',
        categoria: '',
        plazo_pago: 60
    });

    useEffect(() => {
        Promise.all([loadInvoices(), loadProjects()]);
    }, []);

    useEffect(() => {
        if (selectedInvoice) {
            setUpdateData({
                status: selectedInvoice.status,
                admin_notes: selectedInvoice.admin_notes || '',
                payment_date: selectedInvoice.payment_date || '',
                project_id: selectedInvoice.project_id || '',
                categoria: selectedInvoice.categoria || '',
                plazo_pago: selectedInvoice.plazo_pago || 60
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

    const loadProjects = async () => {
        try {
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (err) {
            console.error('Error loading projects:', err);
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
                updateData.payment_date || undefined,
                updateData.project_id || undefined,
                updateData.categoria || undefined,
                updateData.plazo_pago
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
            {/* Filters */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="relative">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2 px-1">Buscar Factura</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Número o proveedor..."
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2 px-1">Estado</label>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium appearance-none"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | 'all')}
                            >
                                <option value="all">Todos los estados</option>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Radicado</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No se encontraron registros</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => {
                                    const statusConfig = STATUS_CONFIG[invoice.status];
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                                                    {invoice.radicado_number || 'SIN RADICAR'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{invoice.provider?.business_name}</div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
                                                    {invoice.provider?.document_type?.toUpperCase()} {invoice.provider?.document_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-300" />
                                                    {invoice.invoice_number}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase font-black">{invoice.invoice_type === 'factura' ? 'Factura' : 'Cuenta de Cobro'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900 text-lg">
                                                ${invoice.amount.toLocaleString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                                                {new Date(invoice.issue_date).toLocaleDateString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 ${statusConfig.bg} ${statusConfig.border} border rounded-full shadow-sm`}>
                                                    <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedInvoice(invoice)}
                                                        className="p-3 bg-white hover:bg-blue-50 border border-gray-100 rounded-2xl transition-all text-blue-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                                        title="Gestionar y Revisar"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {invoice.document_url && (
                                                        <a
                                                            href={invoice.document_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all text-gray-600 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                                            title="Ver Soporte PDF"
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedInvoice(null)}
                >
                    <div 
                        className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-10 pb-6 border-b border-gray-100 bg-gray-50/50">
                             <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-black text-blue-600 bg-white border border-blue-100 px-3 py-1 rounded-full shadow-sm">
                                        RADICADO: {selectedInvoice.radicado_number || 'PENDIENTE'}
                                    </span>
                                    <h2 className="text-3xl font-black text-gray-900 mt-3 italic tracking-tight uppercase">
                                        Revisión de Factura
                                    </h2>
                                    <p className="text-gray-500 font-bold text-sm tracking-widest mt-1">
                                        {selectedInvoice.provider?.business_name.toUpperCase()}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedInvoice(null)}
                                    className="p-3 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all border border-gray-100 shadow-sm"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                             </div>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 space-y-8">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto de Factura</div>
                                    <div className="text-3xl font-black text-gray-900">${selectedInvoice.amount.toLocaleString('es-CO')}</div>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Número de Soporte</div>
                                    <div className="text-3xl font-black text-gray-900 italic">#{selectedInvoice.invoice_number}</div>
                                </div>
                            </div>

                            {/* Project and Category Allocation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                         <TrendingUp className="w-4 h-4" /> Vincular a Proyecto
                                    </label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold appearance-none"
                                        value={updateData.project_id}
                                        onChange={(e) => setUpdateData({ ...updateData, project_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar Proyecto...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                         <DollarSign className="w-4 h-4" /> Categoría de Gasto
                                    </label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold appearance-none"
                                        value={updateData.categoria}
                                        onChange={(e) => setUpdateData({ ...updateData, categoria: e.target.value })}
                                    >
                                        <option value="">Seleccionar Categoría...</option>
                                        <optgroup label="Gastos Proyectos">
                                            <option value="transporte_aereo">Transporte - Aéreo</option>
                                            <option value="produccion_freelancers">Producción - Freelancers</option>
                                            <option value="personal_periodistas">Personal - Periodistas</option>
                                            <option value="servicios_tic">Servicios TIC</option>
                                            <option value="logistica">Logística</option>
                                            <option value="publicidad_redes">Publicidad - Redes</option>
                                        </optgroup>
                                        <optgroup label="Gastos Fijos">
                                            <option value="fijo_servicios">Servicios TIC (Fijo)</option>
                                            <option value="fijo_logistica">Logística (Fijo)</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Plazo de Pago Adjustment (Admin only editable here) */}
                            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Plazo de Pago</div>
                                        <div className="text-xs text-blue-700 font-bold max-w-[180px]">Días acordados para el desembolso después del radicado.</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-blue-200 shadow-sm">
                                        <input 
                                            type="number"
                                            className="w-20 px-4 py-3 bg-transparent outline-none font-black text-center text-blue-600 text-xl"
                                            value={updateData.plazo_pago}
                                            onChange={(e) => setUpdateData({ ...updateData, plazo_pago: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="pr-4 text-xs font-black text-blue-600 uppercase tracking-widest border-l border-blue-100 pl-3">Días</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Fecha Estimada</div>
                                        <div className="text-sm font-black text-blue-600">
                                            {selectedInvoice.issue_date ? (
                                                new Date(new Date(selectedInvoice.issue_date).getTime() + (updateData.plazo_pago * 24 * 60 * 60 * 1000)).toLocaleDateString('es-CO', {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })
                                            ) : '--'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status and Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Acción / Estado</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-900"
                                        value={updateData.status}
                                        onChange={(e) => setUpdateData({ ...updateData, status: e.target.value as InvoiceStatus })}
                                    >
                                        <option value="pendiente">Mantener Pendiente</option>
                                        <option value="en_revision">En Revisión Central</option>
                                        <option value="aprobado">Aprobar para Pago</option>
                                        <option value="devuelto">⚠️ Devolver para Ajustes</option>
                                        <option value="rechazado">❌ Rechazar Definitivamente</option>
                                        <option value="pagado">✅ Marcar como Pagado</option>
                                    </select>
                                </div>
                                {updateData.status === 'pagado' && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Fecha Efectiva de Pago</label>
                                        <input
                                            type="date"
                                            className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                            value={updateData.payment_date}
                                            onChange={(e) => setUpdateData({ ...updateData, payment_date: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Observaciones y Retroalimentación
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium resize-none shadow-inner"
                                    placeholder={updateData.status === 'devuelto' ? "Especifica QUÉ debe corregir el proveedor..." : "Notas internas o para el proveedor..."}
                                    value={updateData.admin_notes}
                                    onChange={(e) => setUpdateData({ ...updateData, admin_notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 pt-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                disabled={isUpdating}
                                className="px-10 py-4 bg-white text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all border border-gray-100 shadow-sm uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={isUpdating}
                                className={`
                                    px-10 py-4 rounded-2xl font-black text-sm transition-all border-b-4 flex items-center gap-3 uppercase tracking-widest
                                    ${updateData.status === 'devuelto' 
                                        ? 'bg-orange-500 border-orange-700 text-white hover:bg-orange-600' 
                                        : 'bg-blue-600 border-blue-800 text-white hover:bg-blue-700'}
                                `}
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    'Guardar Gestión'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

