'use client';

import { useState, useEffect } from 'react';
import { comercialesService, Comercial, CreateComercialInput } from '@/features/finance/services/comercialesService';
import { Plus, Pencil, Trash2, UserCheck, UserX, Users, Percent } from 'lucide-react';

export function ComercialesManager() {
    const [comerciales, setComerciales] = useState<Comercial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingComercial, setEditingComercial] = useState<Comercial | null>(null);
    const [formData, setFormData] = useState<CreateComercialInput>({
        nombre: '',
        email: '',
        telefono: '',
        porcentaje_comision_default: 10,
        is_active: true,
        notas: '',
    });

    useEffect(() => {
        loadComerciales();
    }, [showInactive]);

    const loadComerciales = async () => {
        try {
            setIsLoading(true);
            const data = await comercialesService.getComerciales(showInactive);
            setComerciales(data);
        } catch (error) {
            console.error('Error al cargar comerciales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingComercial) {
                await comercialesService.updateComercial(editingComercial.id, formData);
            } else {
                await comercialesService.createComercial(formData);
            }
            await loadComerciales();
            closeForm();
        } catch (error) {
            console.error('Error al guardar comercial:', error);
            alert('Error al guardar el comercial');
        }
    };

    const handleEdit = (comercial: Comercial) => {
        setEditingComercial(comercial);
        setFormData({
            nombre: comercial.nombre,
            email: comercial.email || '',
            telefono: comercial.telefono || '',
            porcentaje_comision_default: comercial.porcentaje_comision_default,
            is_active: comercial.is_active,
            notas: comercial.notas || '',
        });
        setIsFormOpen(true);
    };

    const handleToggleActive = async (comercial: Comercial) => {
        try {
            if (comercial.is_active) {
                await comercialesService.deactivateComercial(comercial.id);
            } else {
                await comercialesService.activateComercial(comercial.id);
            }
            await loadComerciales();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este comercial permanentemente? Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            await comercialesService.deleteComercial(id);
            await loadComerciales();
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('No se puede eliminar el comercial. Puede tener ventas asociadas.');
        }
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingComercial(null);
        setFormData({
            nombre: '',
            email: '',
            telefono: '',
            porcentaje_comision_default: 10,
            is_active: true,
            notas: '',
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Users className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Gestión de Comerciales</h2>
                            <p className="text-sm text-gray-500">Administra los comerciales para asignar comisiones</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Mostrar inactivos
                        </label>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Comercial
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista */}
            <div className="p-6">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : comerciales.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No hay comerciales registrados</p>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            Agregar el primero
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {comerciales.map((comercial) => (
                            <div
                                key={comercial.id}
                                className={`flex items-center justify-between p-4 rounded-lg border ${
                                    comercial.is_active
                                        ? 'bg-white border-gray-200'
                                        : 'bg-gray-50 border-gray-100 opacity-60'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                        comercial.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                                    }`}>
                                        {comercial.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{comercial.nombre}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            {comercial.email && <span>{comercial.email}</span>}
                                            {comercial.telefono && <span>{comercial.telefono}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                                        <Percent className="w-3 h-3" />
                                        {comercial.porcentaje_comision_default}%
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEdit(comercial)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(comercial)}
                                            className={`p-2 rounded-lg transition-colors ${
                                                comercial.is_active
                                                    ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                            }`}
                                            title={comercial.is_active ? 'Desactivar' : 'Activar'}
                                        >
                                            {comercial.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comercial.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de formulario */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingComercial ? 'Editar Comercial' : 'Nuevo Comercial'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Nombre del comercial"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="+57 300 000 0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    % Comisión por defecto
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={formData.porcentaje_comision_default}
                                    onChange={(e) => setFormData({ ...formData, porcentaje_comision_default: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas
                                </label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">
                                    Comercial activo
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    {editingComercial ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
