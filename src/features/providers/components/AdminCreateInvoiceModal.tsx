'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Search, Upload, FileText, ChevronDown } from 'lucide-react';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { providerService } from '../services/providerService';
import { Provider, InvoiceType } from '../types/provider.types';

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

interface FileSlot {
    file: File | null;
    url: string | null;
    uploading: boolean;
}

const emptySlot = (): FileSlot => ({ file: null, url: null, uploading: false });

export function AdminCreateInvoiceModal({ onClose, onCreated }: Props) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [providerSearch, setProviderSearch] = useState('');
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        invoice_type: 'cuenta_cobro' as InvoiceType,
        invoice_number: '',
        issue_date: new Date().toISOString().split('T')[0],
        concept: '',
        valor_neto: '',
        iva_porcentaje: '0',
        tiene_iva: false,
        plazo_pago: 60,
    });

    const [docPrincipal, setDocPrincipal] = useState<FileSlot>(emptySlot());
    const [docOrdenCompra, setDocOrdenCompra] = useState<FileSlot>(emptySlot());
    const [docSegSocial, setDocSegSocial] = useState<FileSlot>(emptySlot());
    const [docRelease, setDocRelease] = useState<FileSlot>(emptySlot());

    useEffect(() => {
        providerService.getProviders().then(setProviders).catch(console.error);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowProviderDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const valorNeto = parseFloat(form.valor_neto.replace(/\./g, '').replace(',', '.')) || 0;
    const ivaPorc = form.tiene_iva ? 19 : 0;
    const ivaValor = form.tiene_iva ? Math.round(valorNeto * 0.19) : 0;
    const totalConIva = valorNeto + ivaValor;

    const filteredProviders = providers.filter(p =>
        p.business_name.toLowerCase().includes(providerSearch.toLowerCase()) ||
        (p.document_number || '').includes(providerSearch)
    );

    const uploadFile = async (
        file: File,
        slot: FileSlot,
        setSlot: (s: FileSlot) => void,
        label: string
    ) => {
        if (!selectedProvider) return;
        setSlot({ ...slot, file, uploading: true });
        try {
            const url = await providerInvoiceService.uploadInvoiceDocument(
                selectedProvider.id,
                form.invoice_number || `ADMIN-${Date.now()}`,
                file
            );
            setSlot({ file, url, uploading: false });
        } catch {
            setSlot(emptySlot());
            setError(`Error al subir ${label}`);
        }
    };

    const FileUploadBox = ({
        label,
        icon,
        slot,
        setSlot,
        required = false,
    }: {
        label: string;
        icon: React.ReactNode;
        slot: FileSlot;
        setSlot: (s: FileSlot) => void;
        required?: boolean;
    }) => {
        const inputRef = useRef<HTMLInputElement>(null);
        return (
            <div
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/30 ${slot.url ? 'border-green-400 bg-green-50/40' : 'border-gray-200 bg-gray-50/50'}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f, slot, setSlot, label);
                    }}
                />
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`shrink-0 ${slot.url ? 'text-green-500' : 'text-gray-400'}`}>{icon}</div>
                    <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${required ? '' : 'text-gray-500'}`}>
                            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                            {slot.uploading ? 'Subiendo...' : slot.url ? '✓ Cargado' : slot.file?.name || 'Seleccionar archivo'}
                        </p>
                    </div>
                    {slot.uploading && <Loader2 className="w-3 h-3 animate-spin text-blue-400 shrink-0" />}
                </div>
            </div>
        );
    };

    const handleSubmit = async () => {
        setError('');
        if (!selectedProvider) return setError('Selecciona un proveedor');
        if (!form.invoice_number.trim()) return setError('Ingresa el número de factura/cuenta');
        if (!form.concept.trim()) return setError('Ingresa el concepto');
        if (valorNeto <= 0) return setError('Ingresa un valor válido');
        if (!docPrincipal.url) return setError('El documento principal (factura/cuenta) es obligatorio');

        setIsSubmitting(true);
        try {
            await providerInvoiceService.createInvoice({
                provider_id: selectedProvider.id,
                invoice_number: form.invoice_number,
                invoice_type: form.invoice_type,
                issue_date: form.issue_date,
                amount: totalConIva,
                valor_neto: valorNeto,
                iva_porcentaje: ivaPorc,
                iva_valor: ivaValor,
                total_con_iva: totalConIva,
                plazo_pago: form.plazo_pago,
                concept: form.concept,
                document_url: docPrincipal.url || undefined,
                orden_compra_url: docOrdenCompra.url || undefined,
                seguridad_social_url: docSegSocial.url || undefined,
                release_url: docRelease.url || undefined,
            });
            onCreated();
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al registrar la factura');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-8 py-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Registrar Factura / Cuenta de Cobro</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Radica un documento en nombre de un proveedor</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="px-8 py-6 space-y-6">

                    {/* Proveedor */}
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Proveedor *</label>
                        <div className="relative" ref={dropdownRef}>
                            <div
                                onClick={() => setShowProviderDropdown(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-transparent rounded-2xl cursor-pointer hover:bg-gray-100 transition-all"
                            >
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                {selectedProvider ? (
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-800 truncate">{selectedProvider.business_name}</p>
                                        <p className="text-xs text-gray-400">{selectedProvider.document_type?.toUpperCase()} {selectedProvider.document_number}</p>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-sm">Buscar proveedor...</span>
                                )}
                                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                            </div>
                            {showProviderDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                                    <div className="p-3 border-b">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Buscar por nombre o NIT..."
                                            className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl outline-none"
                                            value={providerSearch}
                                            onChange={(e) => setProviderSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredProviders.slice(0, 20).map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => { setSelectedProvider(p); setShowProviderDropdown(false); setProviderSearch(''); }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-all border-b border-gray-50 last:border-0"
                                            >
                                                <p className="font-semibold text-sm text-gray-800">{p.business_name}</p>
                                                <p className="text-xs text-gray-400">{p.document_type?.toUpperCase()} {p.document_number}</p>
                                            </button>
                                        ))}
                                        {filteredProviders.length === 0 && (
                                            <p className="text-center text-gray-400 text-sm py-6">Sin resultados</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tipo de documento */}
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-3">Tipo de Documento</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['cuenta_cobro', 'factura'] as InvoiceType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setForm(f => ({ ...f, invoice_type: type }))}
                                    className={`py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all ${form.invoice_type === type ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    {type === 'cuenta_cobro' ? 'Cuenta de Cobro' : 'Factura'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Datos principales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Número *</label>
                            <input
                                type="text"
                                placeholder="Ej: CC-2026-001"
                                className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium"
                                value={form.invoice_number}
                                onChange={(e) => setForm(f => ({ ...f, invoice_number: e.target.value }))}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Fecha de Emisión *</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium"
                                value={form.issue_date}
                                onChange={(e) => setForm(f => ({ ...f, issue_date: e.target.value }))}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Concepto / Descripción *</label>
                            <textarea
                                rows={2}
                                placeholder="Describe el servicio o producto facturado..."
                                className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium resize-none"
                                value={form.concept}
                                onChange={(e) => setForm(f => ({ ...f, concept: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Valores */}
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-3">Valores</label>
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 block mb-1">Valor Neto *</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium border border-gray-200"
                                        value={form.valor_neto}
                                        onChange={(e) => setForm(f => ({ ...f, valor_neto: e.target.value }))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 block mb-1">Plazo de Pago</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium border border-gray-200"
                                        value={form.plazo_pago}
                                        onChange={(e) => setForm(f => ({ ...f, plazo_pago: parseInt(e.target.value) || 60 }))}
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.tiene_iva}
                                    onChange={(e) => setForm(f => ({ ...f, tiene_iva: e.target.checked }))}
                                    className="w-4 h-4 rounded accent-blue-600"
                                />
                                <span className="text-sm text-gray-600 font-medium">Aplica IVA 19%</span>
                            </label>
                            {valorNeto > 0 && (
                                <div className="border-t border-gray-200 pt-3 space-y-1">
                                    {form.tiene_iva && (
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>IVA (19%)</span>
                                            <span>${ivaValor.toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-black text-base text-blue-700">
                                        <span>TOTAL</span>
                                        <span>${totalConIva.toLocaleString('es-CO')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Documentos */}
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-3">
                            Documentos Soporte
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <FileUploadBox
                                label={form.invoice_type === 'cuenta_cobro' ? 'Cuenta de Cobro' : 'Factura'}
                                icon={<FileText className="w-4 h-4" />}
                                slot={docPrincipal}
                                setSlot={setDocPrincipal}
                                required
                            />
                            <FileUploadBox
                                label="Orden de Compra"
                                icon={<Upload className="w-4 h-4" />}
                                slot={docOrdenCompra}
                                setSlot={setDocOrdenCompra}
                            />
                            <FileUploadBox
                                label="Seguridad Social"
                                icon={<Upload className="w-4 h-4" />}
                                slot={docSegSocial}
                                setSlot={setDocSegSocial}
                            />
                            <FileUploadBox
                                label="Release"
                                icon={<Upload className="w-4 h-4" />}
                                slot={docRelease}
                                setSlot={setDocRelease}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">* Documento principal obligatorio. El resto es opcional.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-medium">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all border border-gray-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedProvider}
                        className="px-8 py-3 rounded-2xl font-black text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-b-4 border-blue-800"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                        ) : (
                            'Registrar Factura'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
