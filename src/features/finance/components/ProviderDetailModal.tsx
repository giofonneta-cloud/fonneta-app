'use client';

import { useState, useEffect } from 'react';
import { Provider, ProviderDocument } from '@/features/providers/types/provider.types';
import { providerService } from '@/features/providers/services/providerService';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { X, FileText, Download, ExternalLink, MapPin, Phone, Mail, FileCheck } from 'lucide-react';

interface Props {
    providerId: string | null;
    onClose: () => void;
}

const documentTypeLabel: Record<string, string> = {
    RUT: 'RUT',
    Camara_Comercio: 'Cámara de Comercio',
    Cedula_Rep_Legal: 'Cédula Representante Legal',
    Cert_Bancaria: 'Certificado Bancario',
    Poliza: 'Póliza',
    Habeas_Data: 'Habeas Data',
    Release_Document: 'Release Document',
    Soporte_Seguridad_Social: 'Soporte Seguridad Social',
};

const documentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
        aprobado: 'bg-emerald-100 text-emerald-700',
        en_revision: 'bg-amber-100 text-amber-700',
        rechazado: 'bg-rose-100 text-rose-700',
        vencido: 'bg-orange-100 text-orange-700',
    };
    const labels: Record<string, string> = {
        aprobado: 'Aprobado',
        en_revision: 'En revisión',
        rechazado: 'Rechazado',
        vencido: 'Vencido',
    };
    return <Badge className={`${colors[status] || 'bg-slate-100 text-slate-700'} border-none text-[10px] font-bold`}>{labels[status] || status}</Badge>;
};

const onboardingStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
        'EN REVISION': 'bg-amber-100 text-amber-700',
        'VALIDADO': 'bg-emerald-100 text-emerald-700',
        'DEVUELTO': 'bg-rose-100 text-rose-700',
    };
    return <Badge className={`${colors[status] || 'bg-slate-100 text-slate-700'} border-none text-[10px] font-bold`}>{status}</Badge>;
};

export function ProviderDetailModal({ providerId, onClose }: Props) {
    const [provider, setProvider] = useState<Provider | null>(null);
    const [documents, setDocuments] = useState<ProviderDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!providerId) return;

        const loadProvider = async () => {
            setLoading(true);
            try {
                const [providerData, docsData] = await Promise.all([
                    providerService.getProviderById(providerId),
                    providerService.getProviderDocuments(providerId),
                ]);
                setProvider(providerData);
                setDocuments(docsData);
            } catch (error) {
                console.error('Error loading provider:', error);
                onClose();
            } finally {
                setLoading(false);
            }
        };

        loadProvider();
    }, [providerId, onClose]);

    if (!providerId || !provider) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{provider.business_name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {onboardingStatusBadge(provider.onboarding_status)}
                            {provider.is_provider && <Badge className="bg-blue-100 text-blue-700 border-none text-[10px]">Proveedor</Badge>}
                            {provider.is_client && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">Cliente</Badge>}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Datos de Contacto */}
                        {(provider.contact_email || provider.contact_phone || provider.contact_name) && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">Datos de Contacto</h3>
                                <div className="space-y-2">
                                    {provider.contact_name && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500 font-medium w-24">Contacto:</span>
                                            <span className="text-sm text-slate-800 font-medium">{provider.contact_name}</span>
                                        </div>
                                    )}
                                    {provider.contact_email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <a href={`mailto:${provider.contact_email}`} className="text-sm text-blue-600 hover:underline">{provider.contact_email}</a>
                                        </div>
                                    )}
                                    {provider.contact_phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <a href={`tel:${provider.contact_phone}`} className="text-sm text-blue-600 hover:underline">{provider.contact_phone}</a>
                                        </div>
                                    )}
                                    {provider.billing_email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs text-slate-600">Facturación: <span className="font-medium">{provider.billing_email}</span></span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Dirección */}
                        {(provider.address || provider.city || provider.department) && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Ubicación
                                </h3>
                                <div className="space-y-1 text-sm text-slate-700">
                                    {provider.address && <p>{provider.address}</p>}
                                    {provider.city && (
                                        <p>{provider.city} {provider.department ? `- ${provider.department}` : ''}</p>
                                    )}
                                    {provider.country && <p className="text-xs text-slate-500">{provider.country}</p>}
                                </div>
                            </section>
                        )}

                        {/* Datos Fiscales */}
                        {(provider.document_type || provider.document_number || provider.person_type) && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileCheck className="w-4 h-4" />
                                    Datos Fiscales
                                </h3>
                                <div className="space-y-2">
                                    {provider.person_type && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Tipo de persona:</span>
                                            <span className="text-sm font-medium text-slate-800 capitalize">{provider.person_type === 'natural' ? 'Natural' : 'Jurídica'}</span>
                                        </div>
                                    )}
                                    {provider.document_type && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Tipo de documento:</span>
                                            <span className="text-sm font-medium text-slate-800 capitalize">{provider.document_type.replace('_', ' ')}</span>
                                        </div>
                                    )}
                                    {provider.document_number && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">Número:</span>
                                            <span className="text-sm font-mono font-bold text-slate-900">{provider.document_number}</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Documentos */}
                        {documents.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Documentos Cargados ({documents.length})
                                </h3>
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800">{documentTypeLabel[doc.tipo_documento] || doc.tipo_documento}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {documentStatusBadge(doc.estado)}
                                                    {doc.fecha_vencimiento && (
                                                        <span className="text-xs text-slate-500">Vence: {new Date(doc.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CO')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {doc.archivo_url && (
                                                <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-blue-100 rounded transition-colors">
                                                    <ExternalLink className="w-4 h-4 text-blue-600" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* URLs directas de documentos */}
                        {(provider.rut_url || provider.cedula_url || provider.camara_comercio_url || provider.cert_bancaria_url) && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">Documentos de Registro</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {provider.rut_url && (
                                        <a href={provider.rut_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors">
                                            <Download className="w-4 h-4 text-slate-600" />
                                            <span className="text-xs font-medium text-slate-700">RUT</span>
                                        </a>
                                    )}
                                    {provider.cedula_url && (
                                        <a href={provider.cedula_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors">
                                            <Download className="w-4 h-4 text-slate-600" />
                                            <span className="text-xs font-medium text-slate-700">Cédula</span>
                                        </a>
                                    )}
                                    {provider.camara_comercio_url && (
                                        <a href={provider.camara_comercio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors">
                                            <Download className="w-4 h-4 text-slate-600" />
                                            <span className="text-xs font-medium text-slate-700">Cámara</span>
                                        </a>
                                    )}
                                    {provider.cert_bancaria_url && (
                                        <a href={provider.cert_bancaria_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors">
                                            <Download className="w-4 h-4 text-slate-600" />
                                            <span className="text-xs font-medium text-slate-700">Banco</span>
                                        </a>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Footer */}
                        <div className="pt-4 border-t border-slate-100">
                            <Button onClick={onClose} variant="outline" className="w-full">
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
