"use client";

import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Building2, CreditCard, Loader2, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { providerService } from '../services/providerService';
import { COLOMBIA_DEPARTMENTS, COLOMBIA_CITIES_BY_DEPT } from '@/shared/lib/colombia-data';
import { supabase } from '@/shared/lib/supabase';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type OnboardingStep = 'basics' | 'documents' | 'contact' | 'finish';

const documentTypes = [
    { id: 'RUT', label: 'RUT (Registro Único Tributario)' },
    { id: 'Camara_Comercio', label: 'Cámara de Comercio (<30 días)' },
    { id: 'Cedula_Rep_Legal', label: 'Cédula Representante Legal' },
    { id: 'Cert_Bancaria', label: 'Certificación Bancaria' },
    { id: 'Habeas_Data', label: 'Habeas Data' },
];

export function ProviderOnboarding() {
    const [step, setStep] = useState<OnboardingStep>('basics');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        business_name: '',
        person_type: 'juridica' as 'natural' | 'juridica',
        document_type: 'nit' as 'nit' | 'cedula_ciudadania' | 'cedula_extranjeria' | 'pasaporte',
        document_number: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        billing_email: '',
        password: '',
        confirm_password: '',
        address: '',
        country: 'Colombia',
        department: '',
        city: '',
    });
    const [uploadedFiles, setUploadedFiles] = useState<{
        RUT: File | null;
        Cedula_Rep_Legal: File | null;
        Camara_Comercio: File | null;
        Cert_Bancaria: File | null;
    }>({
        RUT: null,
        Cedula_Rep_Legal: null,
        Camara_Comercio: null,
        Cert_Bancaria: null,
    });
    const [dataAuthorizationAccepted, setDataAuthorizationAccepted] = useState(false);

    const nextStep = () => {
        if (step === 'basics') {
            if (!formData.business_name || !formData.document_number || !formData.address || !formData.country || (!formData.department && formData.country === 'Colombia') || (!formData.city && formData.country === 'Colombia')) {
                setError('Por favor completa todos los campos obligatorios de identificación y ubicación.');
                return;
            }
            setStep('documents');
        } else if (step === 'documents') {
            // Validar documentos obligatorios
            if (!uploadedFiles.RUT) {
                setError('El RUT es obligatorio');
                return;
            }
            if (!uploadedFiles.Cedula_Rep_Legal) {
                setError('La Cédula del Representante Legal es obligatoria');
                return;
            }
            if (formData.person_type === 'juridica' && !uploadedFiles.Camara_Comercio) {
                setError('La Cámara de Comercio es obligatoria para personas jurídicas');
                return;
            }
            if (!dataAuthorizationAccepted) {
                setError('Debes aceptar la Política de Tratamiento de Datos Personales para continuar');
                return;
            }
            setStep('contact');
        } else if (step === 'contact') {
            if (!formData.contact_name || !formData.contact_email || !formData.contact_phone || !formData.billing_email) {
                setError('Por favor completa todos los campos de información de contacto y facturación.');
                return;
            }
            if (!formData.password || formData.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            if (formData.password !== formData.confirm_password) {
                setError('Las contraseñas no coinciden.');
                return;
            }
            // Aquí se procesa el submit
            handleSubmit();
        }
        setError(null);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            // Validar documentos obligatorios
            if (!uploadedFiles.RUT) {
                throw new Error('El RUT es obligatorio');
            }
            if (!uploadedFiles.Cedula_Rep_Legal) {
                throw new Error('La Cédula del Representante Legal es obligatoria');
            }
            if (formData.person_type === 'juridica' && !uploadedFiles.Camara_Comercio) {
                throw new Error('La Cámara de Comercio es obligatoria para personas jurídicas');
            }

            // Validar checkbox de autorización
            if (!dataAuthorizationAccepted) {
                throw new Error('Debes aceptar la Política de Tratamiento de Datos Personales para continuar');
            }

            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.contact_email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.contact_name,
                        role: 'proveedor'
                    }
                }
            });

            if (authError) {
                throw new Error(`Error al crear usuario: ${authError.message}`);
            }

            if (!authData.user) {
                throw new Error('No se pudo crear el usuario en el sistema de autenticación.');
            }

            // 2. El perfil se crea automáticamente vía trigger (on_auth_user_created)
            // No es necesario crearlo manualmente aquí.

            // 3. Crear registro de proveedor vinculado al user_id
            console.log('Intentando crear proveedor con ID:', authData.user.id);
            const providerData = await providerService.createProvider({
                business_name: formData.business_name,
                person_type: formData.person_type,
                document_type: formData.document_type,
                document_number: formData.document_number,
                contact_name: formData.contact_name,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_phone,
                billing_email: formData.billing_email,
                address: formData.address,
                city: formData.city,
                department: formData.department,
                country: formData.country,
                is_provider: true,
                is_client: false,
                onboarding_status: 'EN REVISION',
                user_id: authData.user.id
            });

            // 4. Subir documentos a Google Drive vía API y guardar enlaces
            const providerId = providerData.id;
            const providerNIT = formData.document_number;
            const providerBusinessName = formData.business_name;

            const uploadedDocuments: { [key: string]: string } = {};

            // Función helper para subir un documento
            const uploadDocument = async (file: File, documentType: string): Promise<string> => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('providerId', providerId);
                formData.append('providerName', providerBusinessName);
                formData.append('providerNIT', providerNIT);
                formData.append('documentType', documentType);

                const response = await fetch('/api/providers/upload-document', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al subir documento');
                }

                const result = await response.json();
                return result.webViewLink;
            };

            // Subir RUT
            if (uploadedFiles.RUT) {
                uploadedDocuments.rut_url = await uploadDocument(uploadedFiles.RUT, 'RUT');
            }

            // Subir Cédula
            if (uploadedFiles.Cedula_Rep_Legal) {
                uploadedDocuments.cedula_url = await uploadDocument(uploadedFiles.Cedula_Rep_Legal, 'Cedula_Rep_Legal');
            }

            // Subir Cámara de Comercio (si aplica)
            if (uploadedFiles.Camara_Comercio) {
                uploadedDocuments.camara_comercio_url = await uploadDocument(uploadedFiles.Camara_Comercio, 'Camara_Comercio');
            }

            // Subir Certificación Bancaria (si existe)
            if (uploadedFiles.Cert_Bancaria) {
                uploadedDocuments.cert_bancaria_url = await uploadDocument(uploadedFiles.Cert_Bancaria, 'Cert_Bancaria');
            }

            // 5. Actualizar registro del proveedor con URLs de documentos
            await supabase
                .from('providers')
                .update({
                    rut_url: uploadedDocuments.rut_url || null,
                    cedula_url: uploadedDocuments.cedula_url || null,
                    camara_comercio_url: uploadedDocuments.camara_comercio_url || null,
                    cert_bancaria_url: uploadedDocuments.cert_bancaria_url || null,
                })
                .eq('id', providerId);

            setStep('finish');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error('Error al registrar proveedor (RAW):', err);
            console.error('Error al registrar proveedor (JSON):', JSON.stringify(err, null, 2));
            const errorMessage = err.message || err.error_description || JSON.stringify(err);
            setError(errorMessage || 'Error al procesar el registro. Inténtalo de nuevo.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 w-full">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Stepper Header */}
                <div className="bg-gray-50/50 p-8 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex gap-4">
                        <StepIndicator icon={Building2} active={step === 'basics'} completed={step !== 'basics'} label="Datos" />
                        <StepIndicator icon={FileText} active={step === 'documents'} completed={['contact', 'finish'].includes(step)} label="Documentos" />
                        <StepIndicator icon={User} active={step === 'contact'} completed={step === 'finish'} label="Contacto" />
                    </div>
                    <div className="text-right hidden sm:block">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Registro de Proveedor</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fonnetapp Setup</p>
                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-center text-red-600 animate-in fade-in slide-in-from-top-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {step === 'basics' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">Razón Social / Nombre Completo *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Ej. Imprenta Los Andes S.A.S"
                                        value={formData.business_name}
                                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Tipo de Persona *</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        value={formData.person_type}
                                        onChange={(e) => setFormData({ ...formData, person_type: e.target.value as any })}
                                    >
                                        <option value="juridica">Jurídica</option>
                                        <option value="natural">Natural</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Tipo de Documento *</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        value={formData.document_type}
                                        onChange={(e) => setFormData({ ...formData, document_type: e.target.value as any })}
                                    >
                                        <option value="nit">NIT</option>
                                        <option value="cedula_ciudadania">Cédula de Ciudadanía</option>
                                        <option value="cedula_extranjeria">Cédula de Extranjería</option>
                                        <option value="pasaporte">Pasaporte</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">Número de Documento / NIT *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Ej. 900.123.456-7"
                                        value={formData.document_number}
                                        onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700 text-purple-600">Ubicación</label>
                                    <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-purple-400">País *</label>
                                                <select
                                                    className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                                                    value={formData.country}
                                                    onChange={(e) => setFormData({ ...formData, country: e.target.value, department: '', city: '' })}
                                                >
                                                    <option value="Colombia">Colombia</option>
                                                    <option value="México">México</option>
                                                    <option value="España">España</option>
                                                    <option value="USA">USA</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-purple-400">Dirección *</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                                                    placeholder="Calle 123 # 45-67"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-purple-400">Departamento *</label>
                                                {formData.country === 'Colombia' ? (
                                                    <select
                                                        className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                                                        value={formData.department}
                                                        onChange={(e) => setFormData({ ...formData, department: e.target.value, city: '' })}
                                                    >
                                                        <option value="">Selecciona...</option>
                                                        {COLOMBIA_DEPARTMENTS.map(dept => (
                                                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                                                        placeholder="Estado / Provincia"
                                                        value={formData.department}
                                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-purple-400">Ciudad / Municipio *</label>
                                                {formData.country === 'Colombia' && formData.department ? (
                                                    <select
                                                        className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    >
                                                        <option value="">Selecciona...</option>
                                                        {COLOMBIA_CITIES_BY_DEPT[COLOMBIA_DEPARTMENTS.find(d => d.name === formData.department)?.id || '']?.map(city => (
                                                            <option key={city} value={city}>{city}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                                                        placeholder="Ciudad"
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                        disabled={formData.country === 'Colombia' && !formData.department}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <button
                                        onClick={nextStep}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-100"
                                    >
                                        Continuar a Documentos
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'contact' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">Nombre de Contacto Principal *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Ej. Juan Pérez"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Email de Contacto *</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="contacto@empresa.com"
                                        value={formData.contact_email}
                                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Teléfono *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="+57 300 123 4567"
                                        value={formData.contact_phone}
                                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">Email de Facturación Electrónica *</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="facturacion@empresa.com"
                                        value={formData.billing_email}
                                        onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                                    />
                                </div>

                                {/* Credenciales de Acceso */}
                                <div className="md:col-span-2 pt-4">
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <User className="w-5 h-5 text-blue-500" />
                                            <label className="text-sm font-bold text-blue-700">Credenciales de Acceso al Portal</label>
                                        </div>
                                        <p className="text-xs text-blue-600 mb-4">
                                            El email de contacto <span className="font-bold">{formData.contact_email || 'ingresado arriba'}</span> será tu usuario para acceder al portal.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-blue-400">Contraseña *</label>
                                                <input
                                                    type="password"
                                                    className="w-full px-4 py-2 bg-white border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                                    placeholder="Mínimo 6 caracteres"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-blue-400">Confirmar Contraseña *</label>
                                                <input
                                                    type="password"
                                                    className="w-full px-4 py-2 bg-white border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                                    placeholder="Repite la contraseña"
                                                    value={formData.confirm_password}
                                                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2 flex justify-between pt-4">
                                    <button onClick={() => setStep('documents')} className="text-gray-400 font-bold text-sm hover:text-gray-600">Atrás</button>
                                    <button
                                        onClick={nextStep}
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-100 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Finalizar Registro
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'documents' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-4 items-start">
                                <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                <p className="text-sm text-blue-700 font-medium">
                                    Por favor adjunta los documentos requeridos. Los archivos deben ser PDF, JPG o PNG (máx. 5MB cada uno).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                                {/* RUT - OBLIGATORIO */}
                                <DocumentUploadCard
                                    id="RUT"
                                    label="RUT Actualizado"
                                    icon={FileText}
                                    iconColor="text-blue-500"
                                    required={true}
                                    file={uploadedFiles.RUT}
                                    onFileChange={(file) => setUploadedFiles({ ...uploadedFiles, RUT: file })}
                                />

                                {/* Cédula Rep. Legal - OBLIGATORIO */}
                                <DocumentUploadCard
                                    id="Cedula_Rep_Legal"
                                    label="Cédula Rep. Legal"
                                    icon={User}
                                    iconColor="text-emerald-500"
                                    required={true}
                                    file={uploadedFiles.Cedula_Rep_Legal}
                                    onFileChange={(file) => setUploadedFiles({ ...uploadedFiles, Cedula_Rep_Legal: file })}
                                />

                                {/* Cámara de Comercio - OBLIGATORIO solo para Jurídicas */}
                                {formData.person_type === 'juridica' && (
                                    <DocumentUploadCard
                                        id="Camara_Comercio"
                                        label="Cámara de Comercio (<30 días)"
                                        icon={Building2}
                                        iconColor="text-indigo-500"
                                        required={true}
                                        file={uploadedFiles.Camara_Comercio}
                                        onFileChange={(file) => setUploadedFiles({ ...uploadedFiles, Camara_Comercio: file })}
                                    />
                                )}

                                {/* Certificación Bancaria - OPCIONAL */}
                                <DocumentUploadCard
                                    id="Cert_Bancaria"
                                    label="Certificación Bancaria"
                                    icon={CreditCard}
                                    iconColor="text-purple-500"
                                    required={false}
                                    file={uploadedFiles.Cert_Bancaria}
                                    onFileChange={(file) => setUploadedFiles({ ...uploadedFiles, Cert_Bancaria: file })}
                                />
                            </div>

                            {/* Checkbox de Autorización de Datos */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={dataAuthorizationAccepted}
                                        onChange={(e) => setDataAuthorizationAccepted(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                        Acepto la{' '}
                                        <a href="/politica-privacidad" target="_blank" className="text-blue-600 underline hover:text-blue-700">
                                            Política de Tratamiento de Datos Personales
                                        </a>{' '}
                                        y autorizo el uso de mi información según lo establecido. <span className="text-red-500">*</span>
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-between pt-6">
                                <button onClick={() => setStep('basics')} className="text-gray-400 font-bold text-sm hover:text-gray-600">Atrás</button>
                                <button
                                    onClick={nextStep}
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    Continuar a Información de Contacto
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'finish' && (
                        <div className="text-center py-10 space-y-6 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900">¡Registro Completado!</h3>

                            <div className="max-w-md mx-auto space-y-4">
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-left">
                                    <h4 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Tus Credenciales de Acceso
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-blue-500 font-medium">Usuario:</span>
                                            <p className="text-blue-900 font-bold">{formData.contact_email}</p>
                                        </div>
                                        <div>
                                            <span className="text-blue-500 font-medium">Contraseña:</span>
                                            <p className="text-blue-900 font-bold">La que acabas de crear</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-500 font-medium text-sm">
                                    Tu cuenta ha sido creada exitosamente. Nuestro equipo administrativo validará tu información y podrás acceder al portal de proveedores.
                                </p>

                                <p className="text-xs text-gray-400">
                                    Revisa tu email <span className="font-bold text-gray-600">{formData.contact_email}</span> para verificar tu cuenta.
                                </p>
                            </div>

                            <button
                                onClick={() => window.location.href = '/login'}
                                className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all"
                            >
                                Ir al Inicio de Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface DocumentUploadCardProps {
    id: string;
    label: string;
    icon: any;
    iconColor: string;
    required: boolean;
    file: File | null;
    onFileChange: (file: File | null) => void;
}

function DocumentUploadCard({ id, label, icon: Icon, iconColor, required, file, onFileChange }: DocumentUploadCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) {
            onFileChange(null);
            return;
        }

        // Validar tipo de archivo
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(selectedFile.type)) {
            alert('Solo se permiten archivos PDF, JPG o PNG');
            e.target.value = '';
            return;
        }

        // Validar tamaño (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB en bytes
        if (selectedFile.size > maxSize) {
            alert('El archivo no debe superar 5MB');
            e.target.value = '';
            return;
        }

        onFileChange(selectedFile);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5", iconColor)} />
                    <span className="text-sm font-bold text-slate-700">
                        {label} {required && <span className="text-red-500">*</span>}
                    </span>
                </div>
                {file ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        {required ? 'Requerido' : 'Opcional'}
                    </span>
                )}
            </div>
            <div onClick={handleClick} className="block cursor-pointer">
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600 font-medium flex-1 truncate">
                        {file ? file.name : 'Seleccionar archivo...'}
                    </span>
                </div>
                <input
                    ref={fileInputRef}
                    id={id}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </div>
    );
}


function StepIndicator({ icon: Icon, active, completed, label }: { icon: any, active: boolean, completed: boolean, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2",
                active ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" :
                    completed ? "bg-green-100 border-green-100 text-green-600" : "bg-white border-gray-200 text-gray-300"
            )}>
                {completed ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={cn(
                "text-xs font-black uppercase tracking-widest hidden sm:block",
                active ? "text-blue-600" : completed ? "text-green-600" : "text-gray-300"
            )}>
                {label}
            </span>
        </div>
    );
}
