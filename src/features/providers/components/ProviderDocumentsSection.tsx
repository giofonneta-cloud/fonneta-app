'use client';

import { useState, useEffect } from 'react';
import { useProviderProfile } from '../hooks/useProviderProfile';
import { providerService } from '../services/providerService';
import { ProviderDocument, DocumentType } from '../types/provider.types';
import { Loader2, Upload, FileText, Eye, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const DOCUMENT_TYPES: { id: DocumentType; label: string; required: boolean }[] = [
    { id: 'RUT', label: 'RUT', required: true },
    { id: 'Camara_Comercio', label: 'Cámara de Comercio', required: false },
    { id: 'Cedula_Rep_Legal', label: 'Cédula Rep. Legal', required: true },
    { id: 'Cert_Bancaria', label: 'Certificación Bancaria', required: false },
    { id: 'Habeas_Data', label: 'Habeas Data', required: false },
    { id: 'Release_Document', label: 'Release Document', required: true },
    { id: 'Soporte_Seguridad_Social', label: 'Soporte Seguridad Social', required: true }
];

export function ProviderDocumentsSection() {
    const { provider, isLoading: profileLoading } = useProviderProfile();
    const [documents, setDocuments] = useState<ProviderDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (provider) {
            loadDocuments();
        }
    }, [provider]);

    const loadDocuments = async () => {
        if (!provider) return;

        try {
            setIsLoading(true);
            
            // Mapear las columnas de URL del proveedor al formato ProviderDocument
            // Esto es necesario porque actualmente guardamos las URLs en columnas directas de la tabla providers
            const mappedDocs: ProviderDocument[] = [];

            if (provider.rut_url) {
                mappedDocs.push({
                    id: 'rut',
                    provider_id: provider.id,
                    tipo_documento: 'RUT',
                    archivo_url: provider.rut_url,
                    estado: provider.onboarding_status === 'VALIDADO' ? 'aprobado' : 'en_revision',
                    created_at: provider.created_at,
                    updated_at: provider.updated_at,
                    fecha_expedicion: null,
                    fecha_vencimiento: null
                });
            }

            if (provider.cedula_url) {
                mappedDocs.push({
                    id: 'cedula',
                    provider_id: provider.id,
                    tipo_documento: 'Cedula_Rep_Legal',
                    archivo_url: provider.cedula_url,
                    estado: provider.onboarding_status === 'VALIDADO' ? 'aprobado' : 'en_revision',
                    created_at: provider.created_at,
                    updated_at: provider.updated_at,
                    fecha_expedicion: null,
                    fecha_vencimiento: null
                });
            }

            if (provider.camara_comercio_url) {
                mappedDocs.push({
                    id: 'camara',
                    provider_id: provider.id,
                    tipo_documento: 'Camara_Comercio',
                    archivo_url: provider.camara_comercio_url,
                    estado: provider.onboarding_status === 'VALIDADO' ? 'aprobado' : 'en_revision',
                    created_at: provider.created_at,
                    updated_at: provider.updated_at,
                    fecha_expedicion: null,
                    fecha_vencimiento: null
                });
            }

            if (provider.cert_bancaria_url) {
                mappedDocs.push({
                    id: 'bancaria',
                    provider_id: provider.id,
                    tipo_documento: 'Cert_Bancaria',
                    archivo_url: provider.cert_bancaria_url,
                    estado: provider.onboarding_status === 'VALIDADO' ? 'aprobado' : 'en_revision',
                    created_at: provider.created_at,
                    updated_at: provider.updated_at,
                    fecha_expedicion: null,
                    fecha_vencimiento: null
                });
            }

            // Si existen documentos en la tabla relacionada, fusionarlos (prioridad a tabla relacionada si implementamos historial)
            let relatedDocs: ProviderDocument[] = [];
            try {
                relatedDocs = await providerService.getProviderDocuments(provider.id);
            } catch (e) {
                console.warn('No se pudieron cargar documentos relacionados, usando solo columnas URL');
            }

            // Combinar, dando preferencia a los documentos de la tabla related si existen para el mismo tipo
            const finalDocs = [...mappedDocs];
            relatedDocs.forEach(d => {
                const existingIndex = finalDocs.findIndex(fd => fd.tipo_documento === d.tipo_documento);
                if (existingIndex >= 0) {
                    finalDocs[existingIndex] = d;
                } else {
                    finalDocs.push(d);
                }
            });

            setDocuments(finalDocs);
        } catch (err: any) {
            console.error('Error al cargar documentos:', err);
            setError('Error al cargar documentos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (type: DocumentType, file: File) => {
        if (!provider) return;

        // Validar tamaño (máx 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('El archivo debe ser menor a 10MB');
            return;
        }

        // Validar tipo
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setError('Solo se permiten archivos PDF, PNG o JPG');
            return;
        }

        try {
            setUploading(type);
            setError(null);

            await providerService.uploadDocument(provider.id, type, file);
            await loadDocuments();

            setUploading(null);
        } catch (err: any) {
            console.error('Error al subir documento:', err);
            setError(err.message || 'Error al subir documento');
            setUploading(null);
        }
    };

    const getDocumentStatus = (type: DocumentType) => {
        const doc = documents.find(d => d.tipo_documento === type);
        if (!doc) return null;

        const config = {
            'en_revision': {
                icon: Clock,
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                border: 'border-yellow-100',
                label: 'En Revisión'
            },
            'aprobado': {
                icon: CheckCircle,
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-100',
                label: 'Aprobado'
            },
            'rechazado': {
                icon: XCircle,
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-100',
                label: 'Rechazado'
            },
            'vencido': {
                icon: AlertTriangle,
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                border: 'border-orange-100',
                label: 'Vencido'
            }
        };

        return { ...config[doc.estado], doc };
    };

    const isExpiringSoon = (doc: ProviderDocument) => {
        if (!doc.fecha_vencimiento) return false;
        const daysUntilExpiry = Math.ceil(
            (new Date(doc.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    };

    if (profileLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!provider) {
        return <div className="text-center py-12 text-gray-500">No se pudo cargar tu perfil</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900">Mis Documentos</h1>
                <p className="text-gray-500 font-medium mt-1">
                    Carga y gestiona tus documentos de proveedor
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium text-sm">{error}</p>
                </div>
            )}

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DOCUMENT_TYPES.map((docType) => {
                    const status = getDocumentStatus(docType.id);
                    const StatusIcon = status?.icon;

                    return (
                        <div
                            key={docType.id}
                            className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4"
                        >
                            {/* Document Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-blue-500" />
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            {docType.label}
                                            {docType.required && (
                                                <span className="text-red-500 ml-1">*</span>
                                            )}
                                        </h3>
                                        {status && (
                                            <div className={`flex items-center gap-2 mt-1 ${status.color}`}>
                                                {StatusIcon && <StatusIcon className="w-4 h-4" />}
                                                <span className="text-xs font-bold">
                                                    {status.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {status && (
                                    <button
                                        onClick={() => setPreviewUrl(status.doc.archivo_url)}
                                        className="p-2 hover:bg-gray-50 rounded-lg transition-all"
                                        title="Ver documento"
                                    >
                                        <Eye className="w-5 h-5 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            {/* Expiring Warning */}
                            {status && isExpiringSoon(status.doc) && (
                                <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-orange-600 text-xs font-bold">
                                    ⚠️ Vence en {Math.ceil((new Date(status.doc.fecha_vencimiento!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días
                                </div>
                            )}

                            {/* Upload */}
                            <div>
                                <label
                                    className={`
                                        block w-full px-4 py-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all
                                        ${uploading === docType.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}
                                    `}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(docType.id, file);
                                        }}
                                        disabled={uploading === docType.id}
                                    />
                                    {uploading === docType.id ? (
                                        <div className="flex items-center justify-center gap-2 text-blue-600">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm font-bold">Subiendo...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 text-gray-500">
                                            <Upload className="w-4 h-4" />
                                            <span className="text-sm font-bold">
                                                {status ? 'Reemplazar documento' : 'Cargar documento'}
                                            </span>
                                        </div>
                                    )}
                                </label>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    PDF, PNG o JPG (máx. 10MB)
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Vista Previa</h3>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {previewUrl.endsWith('.pdf') ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full border-0 rounded-xl"
                                    title="Preview"
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-full mx-auto rounded-xl"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
