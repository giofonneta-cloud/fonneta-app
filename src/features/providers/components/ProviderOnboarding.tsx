"use client";

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Building2, CreditCard, Loader2, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { providerService } from '../services/providerService';
import { COLOMBIA_DEPARTMENTS, COLOMBIA_CITIES_BY_DEPT } from '@/shared/lib/colombia-data';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type OnboardingStep = 'basics' | 'contact' | 'legal' | 'finish';

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
        address: '',
        country: 'Colombia',
        department: '',
        city: '',
    });

    const nextStep = () => {
        if (step === 'basics') {
            if (!formData.business_name || !formData.document_number) {
                setError('Por favor completa los campos obligatorios de identificación.');
                return;
            }
            setStep('contact');
        } else if (step === 'contact') {
            setStep('legal');
        }
        setError(null);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await providerService.createProvider({
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
                onboarding_status: 'EN REVISION'
            });
            setStep('finish');
        } catch (err: any) {
            console.error('Error al registrar proveedor:', err);
            setError(err.message || 'Error al procesar el registro. Inténtalo de nuevo.');
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
                        <StepIndicator icon={User} active={step === 'contact'} completed={['legal', 'finish'].includes(step)} label="Contacto" />
                        <StepIndicator icon={FileText} active={step === 'legal'} completed={step === 'finish'} label="Documentos" />
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
                                    <label className="text-sm font-bold text-gray-700">Tipo de Persona</label>
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
                                    <label className="text-sm font-bold text-gray-700">Tipo de Documento</label>
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
                                                <label className="text-[10px] font-black uppercase text-purple-400">País</label>
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
                                                <label className="text-[10px] font-black uppercase text-purple-400">Dirección</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium"
                                                    placeholder="Calle 123 # 45-67"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-purple-400">Departamento</label>
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
                                                <label className="text-[10px] font-black uppercase text-purple-400">Ciudad / Municipio</label>
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
                                        Continuar a Información de Contacto
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'contact' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">Nombre de Contacto Principal</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Ej. Juan Pérez"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Email de Contacto</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="contacto@empresa.com"
                                        value={formData.contact_email}
                                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Teléfono</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="+57 300 123 4567"
                                        value={formData.contact_phone}
                                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700">Email de Facturación Electrónica</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="facturacion@empresa.com"
                                        value={formData.billing_email}
                                        onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-between pt-4">
                                    <button onClick={() => setStep('basics')} className="text-gray-400 font-bold text-sm hover:text-gray-600">Atrás</button>
                                    <button
                                        onClick={nextStep}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200 hover:scale-[1.01] active:scale-100"
                                    >
                                        Continuar a Documentos
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'legal' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-4 items-start">
                                <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                <p className="text-sm text-blue-700 font-medium">
                                    Para esta fase inicial, omitiremos la carga de archivos. Por favor, confirma que tienes tus documentos listos para finalizar el registro.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                                <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm font-bold text-slate-700">RUT Actualizado</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pendiente</span>
                                </div>
                                <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-700">Cámara de Comercio</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pendiente</span>
                                </div>
                                <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-emerald-500" />
                                        <span className="text-sm font-bold text-slate-700">Cédula Rep. Legal</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pendiente</span>
                                </div>
                                <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-5 h-5 text-purple-500" />
                                        <span className="text-sm font-bold text-slate-700">Certificación Bancaria</span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pendiente</span>
                                </div>
                            </div>

                            <div className="flex justify-between pt-6">
                                <button onClick={() => setStep('basics')} className="text-gray-400 font-bold text-sm hover:text-gray-600">Atrás</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Finalizar Registro
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'finish' && (
                        <div className="text-center py-10 space-y-6 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900">¡Registro Enviado!</h3>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto">
                                Tus datos han sido recibidos. Nuestro equipo administrativo validará la información y se pondrá en contacto pronto.
                            </p>
                            <button 
                                onClick={() => window.location.href = '/login'}
                                className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all"
                            >
                                Volver al Inicio
                            </button>
                        </div>
                    )}
                </div>
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
