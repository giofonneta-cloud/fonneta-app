// Sistema de permisos granulares

import { UserRole } from '@/features/auth/types/auth.types';

export type Permission =
    // Usuarios
    | 'users.view'
    | 'users.create'
    | 'users.edit'
    | 'users.delete'
    | 'users.block'
    // Proyectos
    | 'projects.view'
    | 'projects.view_all'
    | 'projects.create'
    | 'projects.edit'
    | 'projects.edit_all'
    | 'projects.delete'
    | 'projects.change_status'
    // Finanzas
    | 'finance.view'
    | 'finance.view_all'
    | 'finance.create_expense'
    | 'finance.create_sale'
    | 'finance.approve_expense'
    | 'finance.approve_sale'
    | 'finance.edit'
    // Proveedores
    | 'providers.view'
    | 'providers.view_all'
    | 'providers.create'
    | 'providers.invite'
    | 'providers.approve'
    | 'providers.suspend'
    | 'providers.validate_docs'
    // Reportes
    | 'reports.view_basic'
    | 'reports.view_advanced'
    | 'reports.export'
    | 'reports.cashflow'
    // Configuración
    | 'config.view'
    | 'config.modules'
    | 'config.fields'
    | 'config.workflows'
    // Chat
    | 'chat.view'
    | 'chat.create_channel'
    | 'chat.delete_messages'
    // Auditoría
    | 'audit.view'
    | 'audit.view_financial';

export type PermissionLevel = 'none' | 'partial' | 'full';

export interface RolePermissions {
    role: UserRole;
    permissions: Permission[];
    limits?: {
        approvalLimitExpenses?: number;
        approvalLimitSales?: number;
    };
}

// Permisos predeterminados por rol
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [
        // Acceso total
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.block',
        'projects.view', 'projects.view_all', 'projects.create', 'projects.edit', 'projects.edit_all', 'projects.delete', 'projects.change_status',
        'finance.view', 'finance.view_all', 'finance.create_expense', 'finance.create_sale', 'finance.approve_expense', 'finance.approve_sale', 'finance.edit',
        'providers.view', 'providers.view_all', 'providers.create', 'providers.invite', 'providers.approve', 'providers.suspend', 'providers.validate_docs',
        'reports.view_basic', 'reports.view_advanced', 'reports.export', 'reports.cashflow',
        'config.view', 'config.modules', 'config.fields', 'config.workflows',
        'chat.view', 'chat.create_channel', 'chat.delete_messages',
        'audit.view', 'audit.view_financial',
    ],
    pm: [
        'projects.view', 'projects.create', 'projects.edit', 'projects.change_status',
        'finance.view', 'finance.create_expense',
        'providers.view', 'providers.invite',
        'reports.view_basic',
        'chat.view', 'chat.create_channel',
    ],
    administrativo: [
        'projects.view', 'projects.view_all',
        'finance.view', 'finance.view_all', 'finance.create_expense', 'finance.create_sale', 'finance.approve_expense', 'finance.approve_sale', 'finance.edit',
        'providers.view', 'providers.view_all', 'providers.approve', 'providers.validate_docs',
        'reports.view_basic', 'reports.view_advanced', 'reports.export', 'reports.cashflow',
        'chat.view',
        'audit.view_financial',
    ],
    proveedor: [
        'finance.view', // Solo sus facturas
        'providers.view', // Solo su perfil
        'chat.view', // Solo canales asignados
    ],
};

// Helper para verificar permisos
export function hasPermission(
    userPermissions: Permission[],
    requiredPermission: Permission
): boolean {
    return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
    userPermissions: Permission[],
    requiredPermissions: Permission[]
): boolean {
    return requiredPermissions.some(p => userPermissions.includes(p));
}

export function hasAllPermissions(
    userPermissions: Permission[],
    requiredPermissions: Permission[]
): boolean {
    return requiredPermissions.every(p => userPermissions.includes(p));
}
