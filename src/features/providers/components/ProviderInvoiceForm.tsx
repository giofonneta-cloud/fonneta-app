'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProviderProfile } from '../hooks/useProviderProfile';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { InvoiceType } from '../types/provider.types';
import { Loader2, Save, Upload, FileText, DollarSign } from 'lucide-react';

export function ProviderInvoiceForm() {
    const router = useRouter();
    const { provider } = useProviderProfile();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [ordenCompraFile, setOrdenCompraFile] = useState<File | null>(null);
    const [seguridadSocialFile, setSeguridadSocialFile] = useState<File | null>(null);
    const [releaseFile, setReleaseFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        invoice_number: '',
        invoice_type: 'cuenta_cobro' as InvoiceType,
        issue_date: new Date().toISOString().split('T')[0],
        // due_date eliminado
        amount: '',
        concept: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (file.type !== 'application/pdf') {
            setError('Solo se permiten archivos PDF para la factura');
            return;
        }

        // Validar tamaño (máx 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('El archivo debe ser menor a 10MB');
            return;
        }

        setPdfFile(file);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!provider) {
            setError('No se pudo cargar información del proveedor');
            return;
        }

        // Validaciones
        if (!formData.invoice_number || !formData.amount || !formData.concept) {
            setError('Por favor completa todos los campos obligatorios');
            return;
        }

        if (!pdfFile) {
             setError('El documento de Factura / Cuenta de Cobro es obligatorio');
             return;
        }

        if (!ordenCompraFile) {
             setError('La Orden de Compra es obligatoria');
             return;
        }

        if (!seguridadSocialFile) {
             setError('El Soporte de Seguridad Social es obligatorio');
             return;
        }
        
        if (!releaseFile) {
            setError('El Release Document es obligatorio');
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
            let documentUrl: string | undefined;
            let ordenCompraUrl: string | undefined;
            let seguridadSocialUrl: string | undefined;
            let releaseUrl: string | undefined;

            // 1. Subir archivos
            // TODO: Actualizar servicio para soportar carga genérica o crear métodos específicos
            // Por ahora usaremos el mismo método uploadInvoiceDocument cambiando el prefijo del nombre si es necesario
            // o idealmente el servicio debería aceptar el tipo de doc.
            
            // Nota: providerInvoiceService.uploadInvoiceDocument sube a bucket 'invoices'.
            // Usaremos ese para todos por ahora.

            if (pdfFile) {
                documentUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_factura`,
                    pdfFile,
                    amount
                );
            }

            if (ordenCompraFile) {
                ordenCompraUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_orden_compra`,
                    ordenCompraFile,
                    amount
                );
            }

            if (seguridadSocialFile) {
                seguridadSocialUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_seguridad_social`,
                    seguridadSocialFile,
                    amount
                );
            }

            if (releaseFile) {
                releaseUrl = await providerInvoiceService.uploadInvoiceDocument(
                    provider.id,
                    `${formData.invoice_number}_release`,
                    releaseFile,
                    amount
                );
            }

            // 2. Crear factura
            await providerInvoiceService.createInvoice({
                provider_id: provider.id,
                invoice_number: formData.invoice_number,
                invoice_type: formData.invoice_type,
                issue_date: formData.issue_date,
                amount,
                concept: formData.concept,
                document_url: documentUrl,
                orden_compra_url: ordenCompraUrl,
                seguridad_social_url: seguridadSocialUrl,
                release_url: releaseUrl
            });

            // 3. Redirigir al listado
            router.push('/portal/invoices');
        } catch (err: any) {
            console.error('Error al crear factura:', JSON.stringify(err, null, 2));
            const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setError(`Error al registrar factura: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900">Nueva Factura</h1>
                <p className="text-gray-500 font-medium mt-1">
                    Registra una nueva factura o cuenta de cobro
                </p>
            </div>

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
                                placeholder="Ej. F-2024-001"
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
                                placeholder="$ 0"
                                value={formData.amount}
                                onChange={(e) => {
                                    // Formatear monto con puntos de miles
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
                        {/* Fecha de Vencimiento eliminada */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Concepto / Descripción *
                            </label>
                            <textarea
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium resize-none"
                                placeholder="Describe los servicios o productos facturados..."
                                value={formData.concept}
                                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Documentos Requeridos */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Upload className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-bold text-gray-900">Documentos Requeridos</h3>
                    </div>

                    <div className="space-y-4">
                        {/* 1. Factura / Cuenta de Cobro */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Factura / Cuenta de Cobro *</h4>
                                    <p className="text-xs text-gray-500">Formato PDF (Obligatorio)</p>
                                    {pdfFile && <p className="text-xs text-green-600 font-bold mt-1">✓ {pdfFile.name}</p>}
                                </div>
                            </div>
                            <label className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setPdfFile(file);
                                    }}
                                />
                                {pdfFile ? 'Cambiar' : 'Subir'}
                            </label>
                        </div>

                        {/* 2. Orden de Compra */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Orden de Compra *</h4>
                                    <p className="text-xs text-gray-500">PDF, PNG o JPG (Obligatorio)</p>
                                    {ordenCompraFile && <p className="text-xs text-green-600 font-bold mt-1">✓ {ordenCompraFile.name}</p>}
                                </div>
                            </div>
                            <label className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setOrdenCompraFile(file);
                                    }}
                                />
                                {ordenCompraFile ? 'Cambiar' : 'Subir'}
                            </label>
                        </div>

                        {/* 3. Soporte Seguridad Social */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Soporte Seguridad Social *</h4>
                                    <p className="text-xs text-gray-500">Pago mes actual (Obligatorio)</p>
                                    {seguridadSocialFile && <p className="text-xs text-green-600 font-bold mt-1">✓ {seguridadSocialFile.name}</p>}
                                </div>
                            </div>
                            <label className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setSeguridadSocialFile(file);
                                    }}
                                />
                                {seguridadSocialFile ? 'Cambiar' : 'Subir'}
                            </label>
                        </div>

                        {/* 4. Release Document */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <FileText className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Release Document *</h4>
                                    <p className="text-xs text-gray-500">Formato firmado (Obligatorio)</p>
                                    {releaseFile && <p className="text-xs text-green-600 font-bold mt-1">✓ {releaseFile.name}</p>}
                                </div>
                            </div>
                            <label className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm cursor-pointer transition-all">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setReleaseFile(file);
                                    }}
                                />
                                {releaseFile ? 'Cambiar' : 'Subir'}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Registrando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Registrar Factura
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
