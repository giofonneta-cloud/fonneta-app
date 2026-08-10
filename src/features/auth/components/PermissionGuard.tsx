'use client';

import { useAuthStore } from '../store/authStore';
import { Permission } from '@/shared/types/permissions';

interface PermissionGuardProps {
    children: React.ReactNode;
    permission: Permission;
    fallback?: React.ReactNode;
}

/**
 * Componente que protege partes de la UI basándose en permisos granulares.
 * Si el usuario tiene el permiso requerido (o es admin), renderiza los children.
 * De lo contrario, renderiza el fallback opcional.
 */
export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
    const { hasPermission, isLoading } = useAuthStore();

    if (isLoading) return null;

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
