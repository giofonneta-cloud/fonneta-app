'use client';

import { useState } from 'react';
import { UserRole } from '@/features/auth/types/auth.types';
import { 
    Permission, 
    DEFAULT_ROLE_PERMISSIONS, 
    RolePermissions 
} from '../../types/permissions.types';
import { PermissionsMatrix } from './PermissionsMatrix';

export function RoleConfig() {
    const [selectedRole, setSelectedRole] = useState<UserRole>('pm');
    const [permissions, setPermissions] = useState<Record<UserRole, Permission[]>>(DEFAULT_ROLE_PERMISSIONS);
    const [isSaving, setIsSaving] = useState(false);

    const handlePermissionChange = (role: UserRole, permission: Permission, granted: boolean) => {
        setPermissions(prev => {
            const rolePerms = prev[role];
            if (granted) {
                return { ...prev, [role]: [...rolePerms, permission] };
            } else {
                return { ...prev, [role]: rolePerms.filter(p => p !== permission) };
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulando guardado en backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert('Permisos actualizados correctamente');
    };

    const handleReset = () => {
        if (confirm('¿Restablecer permisos a los valores predeterminados?')) {
            setPermissions(DEFAULT_ROLE_PERMISSIONS);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Matriz de Permisos</h2>
                    <p className="text-sm text-gray-500">Configura qué acciones puede realizar cada rol</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                        Restablecer
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <PermissionsMatrix 
                    permissions={permissions}
                    onChange={handlePermissionChange}
                />
            </div>
        </div>
    );
}
