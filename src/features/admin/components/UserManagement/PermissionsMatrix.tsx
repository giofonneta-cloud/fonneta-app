'use client';

import { UserRole } from '@/features/auth/types/auth.types';
import { Permission } from '../../types/permissions.types';

interface Props {
    permissions: Record<UserRole, Permission[]>;
    onChange: (role: UserRole, permission: Permission, granted: boolean) => void;
}

const ROLES: { id: UserRole; label: string }[] = [
    { id: 'admin', label: 'Admin' },
    { id: 'pm', label: 'PM' },
    { id: 'administrativo', label: 'Admin. y Financiero' },
    { id: 'proveedor', label: 'Proveedor' },
];

const PERMISSION_GROUPS = [
    {
        title: 'Usuarios',
        permissions: [
            { id: 'users.view', label: 'Ver Usuarios' },
            { id: 'users.create', label: 'Crear Usuarios' },
            { id: 'users.edit', label: 'Editar Usuarios' },
            { id: 'users.delete', label: 'Eliminar Usuarios' },
            { id: 'users.block', label: 'Bloquear Acceso' },
        ]
    },
    {
        title: 'Proyectos',
        permissions: [
            { id: 'projects.view', label: 'Ver Proyectos' },
            { id: 'projects.view_all', label: 'Ver Todos los Proyectos' },
            { id: 'projects.create', label: 'Crear Proyectos' },
            { id: 'projects.edit', label: 'Editar Proyectos' },
            { id: 'projects.change_status', label: 'Cambiar Estado' },
            { id: 'projects.delete', label: 'Eliminar Proyectos' },
        ]
    },
    {
        title: 'Finanzas',
        permissions: [
            { id: 'finance.view', label: 'Ver Finanzas' },
            { id: 'finance.create_expense', label: 'Registrar Gastos' },
            { id: 'finance.create_sale', label: 'Registrar Ventas' },
            { id: 'finance.approve_expense', label: 'Aprobar Gastos' },
            { id: 'finance.approve_sale', label: 'Aprobar Ventas' },
        ]
    },
    {
        title: 'Proveedores',
        permissions: [
            { id: 'providers.view', label: 'Ver Proveedores' },
            { id: 'providers.invite', label: 'Invitar Proveedores' },
            { id: 'providers.approve', label: 'Aprobar Proveedores' },
            { id: 'providers.validate_docs', label: 'Validar Documentos' },
        ]
    },
    {
        title: 'Configuración',
        permissions: [
            { id: 'config.view', label: 'Ver Configuración' },
            { id: 'config.modules', label: 'Gestionar Módulos' },
            { id: 'config.fields', label: 'Campos Personalizados' },
            { id: 'audit.view', label: 'Ver Auditoría' },
        ]
    }
];

export function PermissionsMatrix({ permissions, onChange }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-64">
                            Permiso / Acción
                        </th>
                        {ROLES.map(role => (
                            <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                {role.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {PERMISSION_GROUPS.map((group) => (
                        <>
                            <tr key={group.title} className="bg-gray-50">
                                <td colSpan={ROLES.length + 1} className="px-6 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    {group.title}
                                </td>
                            </tr>
                            {group.permissions.map((perm) => (
                                <tr key={perm.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 border-r border-gray-100">
                                        {perm.label}
                                    </td>
                                    {ROLES.map((role) => {
                                        const hasPermission = permissions[role.id]?.includes(perm.id as Permission);
                                        const isReadOnly = role.id === 'admin'; // Admin siempre tiene todo

                                        return (
                                            <td key={`${role.id}-${perm.id}`} className="px-6 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={hasPermission}
                                                    onChange={(e) => onChange(role.id, perm.id as Permission, e.target.checked)}
                                                    disabled={isReadOnly}
                                                    className={`w-4 h-4 rounded border-gray-300 focus:ring-indigo-500 
                                                        ${isReadOnly ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 cursor-pointer'}
                                                    `}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
