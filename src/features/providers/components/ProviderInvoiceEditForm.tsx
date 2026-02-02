'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProviderProfile } from '../hooks/useProviderProfile';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { ProviderInvoice, InvoiceType } from '../types/provider.types';
import { Loader2, Save, Upload, FileText, DollarSign, AlertTriangle, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProviderInvoiceEditFormProps {
    invoiceId: string;
}

export function ProviderInvoiceEditForm({ invoiceId }: ProviderInvoiceEditFormProps) {
    const router = useRouter();
    const { provider } = useProviderProfile();
    const [invoice, setInvoice] = useState<ProviderInvoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Archivos nuevos (solo si el usuario quiere reemplazar)
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [ordenCompraFile, setOrdenCompraFile] = useState<File | null>(null);
    const [seguridadSocialFile, setSeguridadSocialFile] = useState<File | null>(null);
    const [releaseFile, setReleaseFile] = useState<File | null>(null);

    const pdfRef = useRef<HTMLInputElement>(null);
    const ordenCompraRef = useRef<HTMLInputElement>(null);
    const seguridadSocialRef = useRef<HTMLInputElement>(null);
    const releaseRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        invoice_number: '',
        invoice_type: 'cuenta_cobro' as InvoiceType,
        issue_date: '',
        amount: '',
        concept: ''
    });

    // Cargar datos de la factura
    useEffect(() => {
        loadInvoice();
    }, [invoiceId]);

    const loadInvoice = async () => {
        try {
            setIsLoading(true);
            const data = await providerInvoiceService.getInvoiceById(invoiceId);
            setInvoice(data);

            // Verificar que sea una factura devuelta
            if (data.status !== 'devuelto') {
                setError('Solo puedes editar facturas con estado "Devuelto"');
                return;
            }

            // Prellenar formulario
            setFormData({
                invoice_number: data.invoice_number,
                invoice_type: data.invoice_type,
                issue_date: data.issue_date,
                amount: `$ ${data.amount.toLocaleString('es-CO')}`,
                concept: data.concept
            });
        } catch (err: unknown) {
            console.error('Error al cargar factura:', err);
            setError('No se pudo cargar la factura');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!provider || !invoice) {
            setError('No se pudo cargar información necesaria');
            return;
        }

        // Validaciones
        if (!formData.invoice_number || !formData.amount || !formData.concept) {
            setError('Por favor completa todos los campos obligatorios');
            return;
        }

        // Limpiar formato de moneda
        const rawAmount = formData.amount.replace(/\D/g, '');
        const amount = parseFloat(rawAmount);

        if (isNaN(amount) || amount <= 0) {
            setError('El monto debe ser un número válido mayor a 0');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            let documentUrl = invoice.document_url;
            let ordenCompraUrl = invoice.orden_compra_url;
            let seguridadSocialUrl = invoice.seguridad_social_url;
            let releaseUrl = invoice.release_url;

            // Subir archivos nuevos si fueron seleccionados
            if (pdfFile) {
                documentUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_factura_v2`,
                    pdfFile,
                    amount
                );
            }

            if (ordenCompraFile) {
                ordenCompraUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_orden_compra_v2`,
                    ordenCompraFile,
                    amount
                );
            }

            if (seguridadSocialFile) {
                seguridadSocialUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_seguridad_social_v2`,
                    seguridadSocialFile,
                    amount
                );
            }

            if (releaseFile) {
                releaseUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_release_v2`,
                    releaseFile,
                    amount
                );
            }

            // Actualizar factura - vuelve a estado pendiente para nueva revisión
            await providerInvoiceService.updateInvoice(invoice.id, {
                invoice_number: formData.invoice_number,
                invoice_type: formData.invoice_type,
                issue_date: formData.issue_date,
                amount,
                concept: formData.concept,
                document_url: documentUrl,
                orden_compra_url: ordenCompraUrl,
                seguridad_social_url: seguridadSocialUrl,
                release_url: releaseUrl,
                status: 'pendiente', // Vuelve a pendiente para nueva revisión
                admin_notes: null // Limpiar notas anteriores
            });

            // Redirigir al listado
            router.push('/portal/invoices');
        } catch (err: unknown) {
            console.error('Error al actualizar factura:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Error al actualizar factura: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!invoice || invoice.status !== 'devuelto') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-800 mb-2">No se puede editar</h2>
                <p className="text-red-600 mb-6">
                    {error || 'Solo puedes editar facturas con estado "Devuelto"'}
                </p>
                <Link
                    href="/portal/invoices"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Mis Facturas
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/portal/invoices"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Corregir Factura</h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Radicado: <span className="text-blue-600 font-bold">{invoice.radicado_number}</span>
                    </p>
                </div>
            </div>

            {/* Alerta de Devolución */}
            {invoice.admin_notes && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <MessageSquare className="w-6 h-6 text-orange-500 mt-1" />
                        <div>
                            <h3 className="font-bold text-orange-800 mb-2">Motivo de Devolución</h3>
                            <p className="text-orange-700">{invoice.admin_notes}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600">
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8">
                {/* Tipo de Factura */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-900">Tipo de Documento</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`
                            p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.invoice_type === 'factura' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
                        `}>
                            <input
                                type="radio"
                                name="invoice_type"
                                value="factura"
                                checked={formData.invoice_type === 'factura'}
                                onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value as InvoiceType })}
                                className="sr-only"
                            />
                            <div className="text-center">
                                <div className="font-bold text-gray-900">Factura</div>
                                <div className="text-xs text-gray-500 mt-1">Para personas jurídicas</div>
                            </div>
                        </label>
                        <label className={`
                            p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.invoice_type === 'cuenta_cobro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
                        `}>
                            <input
                                type="radio"
                                name="invoice_type"
                                value="cuenta_cobro"
                                checked={formData.invoice_type === 'cuenta_cobro'}
                                onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value as InvoiceType })}
                                className="sr-only"
                            />
                            <div className="text-center">
                                <div className="font-bold text-gray-900">Cuenta de Cobro</div>
                                <div className="text-xs text-gray-500 mt-1">Para personas naturales</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Información de Factura */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-bold text-gray-900">Información</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Número de {formData.invoice_type === 'factura' ? 'Factura' : 'Cuenta'} *
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                value={formData.invoice_number}
                                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Monto (COP) *
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                value={formData.amount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    const formatted = val ? `$ ${parseInt(val).toLocaleString('es-CO')}` : '';
                                    setFormData({ ...formData, amount: formatted });
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Fecha de Emisión *
                            </label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Concepto / Descripción *
                            </label>
                            <textarea
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium resize-none"
                                value={formData.concept}
                                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Documentos */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Upload className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-bold text-gray-900">Actualizar Documentos</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Solo sube los documentos que necesitas corregir. Los demás se mantendrán.
                    </p>

                    <div className="space-y-4">
                        {/* 1. Factura / Cuenta de Cobro */}
                        <div className={`border rounded-xl p-4 flex items-center justify-between ${invoice.document_url ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Factura / Cuenta de Cobro</h4>
                                    {invoice.document_url && !pdfFile && (
                                        <p className="text-xs text-green-600 font-medium">Documento actual conservado</p>
                                    )}
                                    {pdfFile && <p className="text-xs text-orange-600 font-bold mt-1">Nuevo: {pdfFile.name}</p>}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => pdfRef.current?.click()}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all"
                            >
                                {pdfFile ? 'Cambiar' : 'Reemplazar'}
                            </button>
                            <input
                                ref={pdfRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setPdfFile(file);
                                }}
                            />
                        </div>

                        {/* 2. Orden de Compra */}
                        <div className={`border rounded-xl p-4 flex items-center justify-between ${invoice.orden_compra_url ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Orden de Compra</h4>
                                    {invoice.orden_compra_url && !ordenCompraFile && (
                                        <p className="text-xs text-green-600 font-medium">Documento actual conservado</p>
                                    )}
                                    {ordenCompraFile && <p className="text-xs text-orange-600 font-bold mt-1">Nuevo: {ordenCompraFile.name}</p>}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => ordenCompraRef.current?.click()}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all"
                            >
                                {ordenCompraFile ? 'Cambiar' : 'Reemplazar'}
                            </button>
                            <input
                                ref={ordenCompraRef}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setOrdenCompraFile(file);
                                }}
                            />
                        </div>

                        {/* 3. Soporte Seguridad Social */}
                        <div className={`border rounded-xl p-4 flex items-center justify-between ${invoice.seguridad_social_url ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Soporte Seguridad Social</h4>
                                    {invoice.seguridad_social_url && !seguridadSocialFile && (
                                        <p className="text-xs text-green-600 font-medium">Documento actual conservado</p>
                                    )}
                                    {seguridadSocialFile && <p className="text-xs text-orange-600 font-bold mt-1">Nuevo: {seguridadSocialFile.name}</p>}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => seguridadSocialRef.current?.click()}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all"
                            >
                                {seguridadSocialFile ? 'Cambiar' : 'Reemplazar'}
                            </button>
                            <input
                                ref={seguridadSocialRef}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setSeguridadSocialFile(file);
                                }}
                            />
                        </div>

                        {/* 4. Release Document */}
                        <div className={`border rounded-xl p-4 flex items-center justify-between ${invoice.release_url ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Release Document</h4>
                                    {invoice.release_url && !releaseFile && (
                                        <p className="text-xs text-green-600 font-medium">Documento actual conservado</p>
                                    )}
                                    {releaseFile && <p className="text-xs text-orange-600 font-bold mt-1">Nuevo: {releaseFile.name}</p>}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => releaseRef.current?.click()}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all"
                            >
                                {releaseFile ? 'Cambiar' : 'Reemplazar'}
                            </button>
                            <input
                                ref={releaseRef}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setReleaseFile(file);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                    <Link
                        href="/portal/invoices"
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Enviar Corrección
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
