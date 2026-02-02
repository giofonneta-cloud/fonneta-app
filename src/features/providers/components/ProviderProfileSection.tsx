'use client';

import { useState, useEffect } from 'react';
import { useProviderProfile } from '../hooks/useProviderProfile';
import { providerService } from '../services/providerService';
import { COLOMBIA_DEPARTMENTS, COLOMBIA_CITIES_BY_DEPT } from '@/shared/lib/colombia-data';
import { Loader2, Save, AlertCircle, CheckCircle, User, MapPin, Mail, Phone } from 'lucide-react';

export function ProviderProfileSection() {
    const { provider, isLoading } = useProviderProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
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
        city: ''
    });

    // Cargar datos del proveedor cuando esté disponible
    useEffect(() => {
        if (provider && !isEditing) {
            setFormData({
                business_name: provider.business_name || '',
                person_type: provider.person_type || 'juridica',
                document_type: provider.document_type || 'nit',
                document_number: provider.document_number || '',
                contact_name: provider.contact_name || '',
                contact_email: provider.contact_email || '',
                contact_phone: provider.contact_phone || '',
                billing_email: provider.billing_email || '',
                address: provider.address || '',
                country: provider.country || 'Colombia',
                department: provider.department || '',
                city: provider.city || ''
            });
        }
    }, [provider, isEditing]);

    const handleSave = async () => {
        if (!provider) return;

        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await providerService.updateProvider(provider.id, formData);
            setSuccess(true);
            setIsEditing(false);

            // Recargar página para actualizar datos
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err: any) {
            console.error('Error al actualizar perfil:', err);
            setError(err.message || 'Error al guardar cambios');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (provider) {
            setFormData({
                business_name: provider.business_name || '',
                person_type: provider.person_type || 'juridica',
                document_type: provider.document_type || 'nit',
                document_number: provider.document_number || '',
                contact_name: provider.contact_name || '',
                contact_email: provider.contact_email || '',
                contact_phone: provider.contact_phone || '',
                billing_email: provider.billing_email || '',
                address: provider.address || '',
                country: provider.country || 'Colombia',
                department: provider.department || '',
                city: provider.city || ''
            });
        }
        setIsEditing(false);
        setError(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No se pudo cargar tu perfil</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Mi Perfil</h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Actualiza tu información de proveedor
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                    >
                        Editar Información
                    </button>
                )}
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-600">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium text-sm">Perfil actualizado exitosamente</p>
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8">
                {/* Información Básica */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <User className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-900">Información Básica</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Razón Social / Nombre Completo *
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.business_name}
                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Tipo de Persona *
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.person_type}
                                onChange={(e) => setFormData({ ...formData, person_type: e.target.value as any })}
                                disabled={!isEditing}
                            >
                                <option value="juridica">Jurídica</option>
                                <option value="natural">Natural</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Tipo de Documento *
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.document_type}
                                onChange={(e) => setFormData({ ...formData, document_type: e.target.value as any })}
                                disabled={!isEditing}
                            >
                                <option value="nit">NIT</option>
                                <option value="cedula_ciudadania">Cédula de Ciudadanía</option>
                                <option value="cedula_extranjeria">Cédula de Extranjería</option>
                                <option value="pasaporte">Pasaporte</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Número de Documento *
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.document_number}
                                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </div>

                {/* Información de Contacto */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Mail className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-bold text-gray-900">Información de Contacto</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Nombre de Contacto *
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Email de Contacto *
                            </label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Teléfono *
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Email de Facturación *
                            </label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.billing_email}
                                onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </div>

                {/* Ubicación */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-bold text-gray-900">Ubicación</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                País *
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value, department: '', city: '' })}
                                disabled={!isEditing}
                            >
                                <option value="Colombia">Colombia</option>
                                <option value="México">México</option>
                                <option value="España">España</option>
                                <option value="USA">USA</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Dirección *
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Departamento *
                            </label>
                            {formData.country === 'Colombia' ? (
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value, city: '' })}
                                    disabled={!isEditing}
                                >
                                    <option value="">Selecciona...</option>
                                    {COLOMBIA_DEPARTMENTS.map(dept => (
                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    disabled={!isEditing}
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">
                                Ciudad *
                            </label>
                            {formData.country === 'Colombia' && formData.department ? (
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    disabled={!isEditing}
                                >
                                    <option value="">Selecciona...</option>
                                    {COLOMBIA_CITIES_BY_DEPT[COLOMBIA_DEPARTMENTS.find(d => d.name === formData.department)?.id || '']?.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium disabled:opacity-50"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    disabled={!isEditing || (formData.country === 'Colombia' && !formData.department)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {isEditing && (
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
