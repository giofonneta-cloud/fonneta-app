'use client';

import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { UserRole } from '@/features/auth/types/auth.types';
import type { ExtendedProfile } from '../../services/userService';
import Link from 'next/link';

export function UsersList() {
    const {
        users,
        total,
        page,
        totalPages,
        isLoading,
        error,
        stats,
        fetchUsers,
        toggleActive,
        sendPasswordReset,
    } = useUsers();

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const handleSearch = () => {
        fetchUsers({
            search: searchTerm || undefined,
            role: roleFilter || undefined,
            isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
            page: 1,
        });
    };

    const handlePageChange = (newPage: number) => {
        fetchUsers({
            search: searchTerm || undefined,
            role: roleFilter || undefined,
            isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
            page: newPage,
        });
    };

    const handleToggleActive = async (user: ExtendedProfile) => {
        if (confirm(`¿Está seguro de ${user.is_active ? 'bloquear' : 'activar'} a ${user.full_name}?`)) {
            await toggleActive(user.id, !user.is_active);
        }
    };

    const handleResetPassword = async (user: ExtendedProfile) => {
        if (confirm(`¿Enviar email de restablecimiento de contraseña a ${user.email}?`)) {
            const result = await sendPasswordReset(user.id);
            if (result.success) {
                alert('Email de restablecimiento enviado');
            } else {
                alert(`Error: ${result.error}`);
            }
        }
    };

    if (isLoading && users.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatBadge label="Total" value={stats.total} color="gray" />
                    <StatBadge label="Admin" value={stats.byRole.admin} color="indigo" />
                    <StatBadge label="PM" value={stats.byRole.pm} color="emerald" />
                    <StatBadge label="Administrativo" value={stats.byRole.administrativo} color="amber" />
                    <StatBadge label="Proveedor" value={stats.byRole.proveedor} color="rose" />
                </div>
            )}

            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todos los roles</option>
                        <option value="admin">Administrador</option>
                        <option value="pm">Project Manager</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="proveedor">Proveedor</option>
                    </select>
                    <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Buscar
                    </button>
                    <Link
                        href="/dashboard/admin/users/new"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Usuario
                    </Link>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Último acceso
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className={!user.is_active ? 'bg-gray-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <span className="text-indigo-600 font-medium">
                                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <RoleBadge role={user.role} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        user.is_active !== false
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {user.is_active !== false ? 'Activo' : 'Bloqueado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.last_login 
                                        ? new Date(user.last_login).toLocaleDateString('es-CO')
                                        : 'Nunca'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/dashboard/admin/users/${user.id}`}
                                            className="p-2 text-gray-400 hover:text-indigo-600"
                                            title="Ver/Editar"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() => handleResetPassword(user)}
                                            className="p-2 text-gray-400 hover:text-amber-600"
                                            title="Restablecer contraseña"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(user)}
                                            className={`p-2 ${user.is_active !== false ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-emerald-600'}`}
                                            title={user.is_active !== false ? 'Bloquear' : 'Activar'}
                                        >
                                            {user.is_active !== false ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No se encontraron usuarios
                    </div>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Mostrando {users.length} de {total} usuarios
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-800',
        indigo: 'bg-indigo-100 text-indigo-800',
        emerald: 'bg-emerald-100 text-emerald-800',
        amber: 'bg-amber-100 text-amber-800',
        rose: 'bg-rose-100 text-rose-800',
    };

    return (
        <div className={`px-4 py-3 rounded-lg ${colors[color]}`}>
            <p className="text-xs font-medium opacity-80">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    );
}

function RoleBadge({ role }: { role: UserRole }) {
    const roleConfig: Record<UserRole, { label: string; color: string }> = {
        admin: { label: 'Administrador', color: 'bg-indigo-100 text-indigo-700' },
        pm: { label: 'Project Manager', color: 'bg-emerald-100 text-emerald-700' },
        administrativo: { label: 'Administrativo', color: 'bg-amber-100 text-amber-700' },
        proveedor: { label: 'Proveedor', color: 'bg-rose-100 text-rose-700' },
    };

    const config = roleConfig[role] || { label: role, color: 'bg-gray-100 text-gray-700' };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.label}
        </span>
    );
}
