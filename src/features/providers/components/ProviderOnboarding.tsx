'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Building2, CreditCard } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type OnboardingStep = 'basics' | 'legal' | 'banking' | 'finish';

const documentTypes = [
    { id: 'RUT', label: 'RUT (Registro Único Tributario)' },
    { id: 'Camara_Comercio', label: 'Cámara de Comercio (<30 días)' },
    { id: 'Cedula_Rep_Legal', label: 'Cédula Representante Legal' },
    { id: 'Cert_Bancaria', label: 'Certificación Bancaria' },
    { id: 'Habeas_Data', label: 'Habeas Data' },
];

export function ProviderOnboarding() {
    const [step, setStep] = useState<OnboardingStep>('basics');
    const [formData, setFormData] = useState({
        business_name: '',
        tax_id: '',
        type: 'juridica',
        email: '',
        phone: '',
        address: '',
    });

    const nextStep = () => {
        if (step === 'basics') setStep('legal');
        else if (step === 'legal') setStep('banking');
        else if (step === 'banking') setStep('finish');
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Stepper Header */}
                <div className="bg-gray-50/50 p-8 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex gap-4">
                        <StepIndicator icon={Building2} active={step === 'basics'} completed={step !== 'basics'} label="Datos" />
                        <StepIndicator icon={FileText} active={step === 'legal'} completed={['banking', 'finish'].includes(step)} label="Legal" />
                        <StepIndicator icon={CreditCard} active={step === 'banking'} completed={step === 'finish'} label="Banco" />
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Onboarding Proveedor</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fonnetapp Setup</p>
                    </div>
                </div>

                <div className="p-8">
                    {step === 'basics' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Razón Social / Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Ej. Imprenta Los Andes S.A.S"
                                        value={formData.business_name}
                                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">NIT / Cédula</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                        placeholder="Ej. 900.123.456-7"
                                        value={formData.tax_id}
                                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={nextStep}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-100"
                                >
                                    Continuar a Documentos
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'legal' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-4 items-start">
                                <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                <p className="text-sm text-blue-700 font-medium">
                                    Carga los documentos solicitados en formato PDF. Asegúrate de que sean legibles y estén vigentes.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documentTypes.map((doc) => (
                                    <div key={doc.id} className="p-4 border border-gray-100 rounded-2xl hover:border-blue-200 transition-colors group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-700">{doc.label}</span>
                                        </div>
                                        <label className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                            <span className="text-xs font-bold text-gray-400 group-hover:text-blue-500">Subir PDF</span>
                                            <input type="file" className="hidden" accept=".pdf" />
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between pt-6">
                                <button onClick={() => setStep('basics')} className="text-gray-400 font-bold text-sm hover:text-gray-600">Atrás</button>
                                <button
                                    onClick={nextStep}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-200"
                                >
                                    Validar y Continuar
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
                                Tus datos y documentos están siendo validados por nuestro equipo administrativo. Recibirás un correo pronto.
                            </p>
                            <button className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all">
                                Ir al Portal del Proveedor
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
