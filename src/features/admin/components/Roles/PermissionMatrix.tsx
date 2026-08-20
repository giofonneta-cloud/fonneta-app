import React from 'react';
import { Permission } from '@/shared/types/permissions';

interface Props {
    selectedPermissions: Permission[];
    onChange: (permissions: Permission[]) => void;
    readonly?: boolean;
}

const PERMISSION_GROUPS: Record<string, { label: string; permissions: { key: Permission; label: string }[] }> = {
    users: {
        label: 'Usuarios',
        permissions: [
            { key: 'users.view', label: 'Ver usuarios' },
            { key: 'users.create', label: 'Crear usuarios' },
            { key: 'users.edit', label: 'Editar usuarios' },
            { key: 'users.delete', label: 'Eliminar usuarios' },
            { key: 'users.block', label: 'Bloquear/Activar' },
        ],
    },
    projects: {
        label: 'Proyectos',
        permissions: [
            { key: 'projects.view', label: 'Ver proyectos asignados' },
            { key: 'projects.view_all', label: 'Ver todos los proyectos' },
            { key: 'projects.create', label: 'Crear proyectos' },
            { key: 'projects.edit', label: 'Editar proyectos asignados' },
            { key: 'projects.edit_all', label: 'Editar cualquier proyecto' },
            { key: 'projects.delete', label: 'Eliminar proyectos' },
            { key: 'projects.change_status', label: 'Cambiar estados' },
        ],
    },
    finance: {
        label: 'Finanzas',
        permissions: [
            { key: 'finance.view', label: 'Ver finanzas personales/asignadas' },
            { key: 'finance.view_all', label: 'Ver finanzas globales' },
            { key: 'finance.create_expense', label: 'Cargar gastos' },
            { key: 'finance.create_sale', label: 'Cargar ventas' },
            { key: 'finance.approve_expense', label: 'Aprobar gastos' },
            { key: 'finance.approve_sale', label: 'Aprobar ventas' },
            { key: 'finance.edit', label: 'Editar registros financieros' },
        ],
    },
    providers: {
        label: 'Proveedores',
        permissions: [
            { key: 'providers.view', label: 'Ver proveedores' },
            { key: 'providers.view_all', label: 'Ver todos los proveedores' },
            { key: 'providers.create', label: 'Crear proveedores' },
            { key: 'providers.invite', label: 'Invitar proveedores' },
            { key: 'providers.approve', label: 'Aprobar registro' },
            { key: 'providers.suspend', label: 'Suspender proveedores' },
            { key: 'providers.validate_docs', label: 'Validar documentos' },
        ],
    },
    reports: {
        label: 'Reportes',
        permissions: [
            { key: 'reports.view_basic', label: 'Reportes básicos' },
            { key: 'reports.view_advanced', label: 'Reportes avanzados/BI' },
            { key: 'reports.export', label: 'Exportar a Excel/PDF' },
            { key: 'reports.cashflow', label: 'Ver flujo de caja' },
        ],
    },
    config: {
        label: 'Configuración',
        permissions: [
            { key: 'config.view', label: 'Ver configuración' },
            { key: 'config.modules', label: 'Gestionar módulos' },
            { key: 'config.fields', label: 'Campos personalizados' },
            { key: 'config.workflows', label: 'Flujos de aprobación' },
        ],
    },
    chat: {
        label: 'Comunicación',
        permissions: [
            { key: 'chat.view', label: 'Acceso al chat' },
            { key: 'chat.create_channel', label: 'Crear canales' },
            { key: 'chat.delete_messages', label: 'Moderar mensajes' },
        ],
    },
    audit: {
        label: 'Auditoría',
        permissions: [
            { key: 'audit.view', label: 'Ver logs de auditoría' },
            { key: 'audit.view_financial', label: 'Auditoría financiera' },
        ],
    },
    quotes: {
        label: 'Cotizaciones',
        permissions: [
            { key: 'quotes.view', label: 'Ver cotizaciones propias' },
            { key: 'quotes.view_all', label: 'Ver todas las cotizaciones' },
            { key: 'quotes.create', label: 'Crear y enviar cotizaciones' },
        ],
    },
};

export function PermissionMatrix({ selectedPermissions, onChange, readonly = false }: Props) {
    const handleToggle = (permission: Permission) => {
        if (readonly) return;
        if (selectedPermissions.includes(permission)) {
            onChange(selectedPermissions.filter(p => p !== permission));
        } else {
            onChange([...selectedPermissions, permission]);
        }
    };

    const handleToggleGroup = (groupKey: string, groupPermissions: Permission[]) => {
        if (readonly) return;
        const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
        if (allSelected) {
            onChange(selectedPermissions.filter(p => !groupPermissions.includes(p)));
        } else {
            const newPermissions = Array.from(new Set([...selectedPermissions, ...groupPermissions]));
            onChange(newPermissions);
        }
    };

    return (
        <div className="space-y-6">
            {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                const groupPermissionKeys = group.permissions.map(p => p.key);
                const allSelected = groupPermissionKeys.every(p => selectedPermissions.includes(p));
                const someSelected = groupPermissionKeys.some(p => selectedPermissions.includes(p));

                return (
                    <div key={key} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-200">{group.label}</h3>
                            {!readonly && (
                                <button
                                    type="button"
                                    onClick={() => handleToggleGroup(key, groupPermissionKeys)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                >
                                    {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                                </button>
                            )}
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.permissions.map((perm) => (
                                <label
                                    key={perm.key}
                                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all ${
                                        selectedPermissions.includes(perm.key)
                                            ? 'bg-indigo-500/10 border border-indigo-500/30'
                                            : 'hover:bg-slate-700/50 border border-transparent'
                                    } ${readonly ? 'cursor-default' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPermissions.includes(perm.key)}
                                        onChange={() => handleToggle(perm.key)}
                                        disabled={readonly}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800"
                                    />
                                    <span className="text-sm text-slate-300">{perm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
