'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/features/auth/types/auth.types';
import { useUsers } from '../../hooks/useUsers';
import type { CreateUserInput, UpdateUserInput, ExtendedProfile } from '../../services/userService';

interface Props {
    userId?: string; // Si se pasa, modo edición
    onSuccess?: () => void;
}

export function UserForm({ userId, onSuccess }: Props) {
    const router = useRouter();
    const { addUser, editUser, fetchUser } = useUsers();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<ExtendedProfile | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'pm' as UserRole,
        phone: '',
        position: '',
        approval_limit_expenses: '',
        approval_limit_sales: '',
        notification_email: true,
        notification_platform: true,
        notification_frequency: 'weekly',
    });

    // Cargar usuario si es edición
    useEffect(() => {
        if (userId) {
            fetchUser(userId).then((data) => {
                if (data) {
                    setUser(data);
                    setFormData({
                        email: data.email,
                        password: '',
                        confirmPassword: '',
                        full_name: data.full_name || '',
                        role: data.role,
                        phone: data.phone || '',
                        position: data.position || '',
                        approval_limit_expenses: data.approval_limit_expenses?.toString() || '',
                        approval_limit_sales: data.approval_limit_sales?.toString() || '',
                        notification_email: data.notification_email ?? true,
                        notification_platform: data.notification_platform ?? true,
                        notification_frequency: data.notification_frequency || 'weekly',
                    });
                }
            });
        }
    }, [userId, fetchUser]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (userId) {
                // Modo edición
                const updates: UpdateUserInput = {
                    full_name: formData.full_name,
                    role: formData.role,
                    phone: formData.phone || undefined,
                    position: formData.position || undefined,
                    approval_limit_expenses: formData.approval_limit_expenses 
                        ? parseFloat(formData.approval_limit_expenses) 
                        : undefined,
                    approval_limit_sales: formData.approval_limit_sales 
                        ? parseFloat(formData.approval_limit_sales) 
                        : undefined,
                    notification_email: formData.notification_email,
                    notification_platform: formData.notification_platform,
                    notification_frequency: formData.notification_frequency,
                };

                const result = await editUser(userId, updates);
                if (!result.success) {
                    throw new Error(result.error);
                }
            } else {
                // Modo creación
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Las contraseñas no coinciden');
                }

                if (formData.password.length < 8) {
                    throw new Error('La contraseña debe tener al menos 8 caracteres');
                }

                const input: CreateUserInput = {
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    role: formData.role,
                    phone: formData.phone || undefined,
                    position: formData.position || undefined,
                    approval_limit_expenses: formData.approval_limit_expenses 
                        ? parseFloat(formData.approval_limit_expenses) 
                        : undefined,
                    approval_limit_sales: formData.approval_limit_sales 
                        ? parseFloat(formData.approval_limit_sales) 
                        : undefined,
                    notification_email: formData.notification_email,
                    notification_platform: formData.notification_platform,
                    notification_frequency: formData.notification_frequency,
                };

                const result = await addUser(input);
                if (!result.success) {
                    throw new Error(result.error);
                }
            }

            onSuccess?.();
            router.push('/dashboard/admin/users');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Información básica */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Información Básica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={!!userId}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        />
                    </div>

                    {!userId && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!userId}
                                    minLength={8}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmar Contraseña *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required={!userId}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol *
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="admin">Administrador</option>
                            <option value="pm">Project Manager</option>
                            <option value="administrativo">Administrativo</option>
                            <option value="proveedor">Proveedor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cargo / Posición
                        </label>
                        <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Límites de aprobación */}
            {(formData.role === 'admin' || formData.role === 'administrativo') && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Límites de Aprobación
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Límite de Gastos (COP)
                            </label>
                            <input
                                type="number"
                                name="approval_limit_expenses"
                                value={formData.approval_limit_expenses}
                                onChange={handleChange}
                                min="0"
                                step="100000"
                                placeholder="Sin límite"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Monto máximo que puede aprobar sin supervisor
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Límite de Ventas (COP)
                            </label>
                            <input
                                type="number"
                                name="approval_limit_sales"
                                value={formData.approval_limit_sales}
                                onChange={handleChange}
                                min="0"
                                step="100000"
                                placeholder="Sin límite"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Monto máximo de venta que puede aprobar
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificaciones */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Preferencias de Notificación
                </h3>
                
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="notification_email"
                            checked={formData.notification_email}
                            onChange={handleChange}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                            Recibir notificaciones por email
                        </span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="notification_platform"
                            checked={formData.notification_platform}
                            onChange={handleChange}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                            Recibir notificaciones en plataforma
                        </span>
                    </label>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frecuencia de resúmenes
                        </label>
                        <select
                            name="notification_frequency"
                            value={formData.notification_frequency}
                            onChange={handleChange}
                            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="daily">Diario</option>
                            <option value="weekly">Semanal</option>
                            <option value="monthly">Mensual</option>
                            <option value="never">Nunca</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isLoading ? 'Guardando...' : userId ? 'Actualizar' : 'Crear Usuario'}
                </button>
            </div>
        </form>
    );
}
