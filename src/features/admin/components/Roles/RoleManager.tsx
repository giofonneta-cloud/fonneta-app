'use client';

import { useState, useEffect } from 'react';
import { roleService } from '../../services/roleService';
import { AppRole, RoleWithMemberCount } from '../../types/role.types';
import { PermissionMatrix } from './PermissionMatrix';
import { Permission } from '@/shared/types/permissions';
import { useParametros } from '../../hooks/useParametros';
import { quoteAccessService, type QuoteCostCenterAccess } from '@/features/quotes/services/quoteAccessService';
import {
    Shield,
    Plus,
    Search,
    Edit2,
    Trash2,
    Info,
    Check,
    X,
    AlertCircle,
    Users
} from 'lucide-react';
import { toast } from 'sonner';

export function RoleManager() {
    const [roles, setRoles] = useState<RoleWithMemberCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<RoleWithMemberCount | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [approvalLimits, setApprovalLimits] = useState({ expenses: 0, sales: 0 });

    // Usuarios asignados al rol seleccionado
    const [assignedUsers, setAssignedUsers] = useState<{ id: string; full_name: string | null; email: string; role: string }[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string; full_name: string | null; email: string; role: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);

    // Accesos por centro de costo (solo relevante para roles con quotes.view sin quotes.view_all)
    const { opciones: centrosCosto } = useParametros('centros_costo');
    const [costCenterAccess, setCostCenterAccess] = useState<QuoteCostCenterAccess[]>([]);
    const showCostCenterControls = permissions.includes('quotes.view') && !permissions.includes('quotes.view_all');

    useEffect(() => {
        loadRoles();
    }, []);

    useEffect(() => {
        const query = userSearch.trim();
        if (!query) { setSearchResults([]); return; }
        setIsSearching(true);
        const timer = setTimeout(() => {
            roleService.searchUsers(query)
                .then(setSearchResults)
                .catch(() => setSearchResults([]))
                .finally(() => setIsSearching(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const loadAssignedUsers = async (roleId: string) => {
        try {
            const users = await roleService.getUsersForRole(roleId);
            setAssignedUsers(users);
        } catch (error) {
            console.error('Error loading assigned users:', error);
        }
    };

    const loadCostCenterAccess = async () => {
        try {
            const access = await quoteAccessService.getAllAccess();
            setCostCenterAccess(access);
        } catch (error) {
            console.error('Error loading cost center access:', error);
        }
    };

    const handleGrantCostCenter = async (userId: string, costCenter: string) => {
        try {
            await quoteAccessService.grantAccess(userId, costCenter);
            await loadCostCenterAccess();
        } catch (error) {
            console.error('Error granting cost center access:', error);
            toast.error('Error al habilitar el centro de costo');
        }
    };

    const handleRevokeCostCenter = async (accessId: string) => {
        try {
            await quoteAccessService.revokeAccess(accessId);
            setCostCenterAccess(prev => prev.filter(a => a.id !== accessId));
        } catch (error) {
            console.error('Error revoking cost center access:', error);
            toast.error('Error al quitar el centro de costo');
        }
    };

    const handleAssignUser = async (userId: string) => {
        if (!selectedRole) return;
        setIsAssigning(true);
        try {
            await roleService.assignRoleToUser(userId, selectedRole.id);
            toast.success('Usuario asignado al rol');
            setUserSearch('');
            setSearchResults([]);
            await loadAssignedUsers(selectedRole.id);
            await loadRoles();
        } catch (error) {
            console.error('Error assigning user:', error);
            toast.error('Error al asignar el usuario');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!selectedRole) return;
        try {
            await roleService.removeRoleFromUser(userId, selectedRole.id);
            toast.success('Usuario removido del rol');
            setAssignedUsers(prev => prev.filter(u => u.id !== userId));
            await loadRoles();
        } catch (error) {
            console.error('Error removing user:', error);
            toast.error('Error al remover el usuario');
        }
    };

    const loadRoles = async () => {
        try {
            setIsLoading(true);
            const data = await roleService.getAllRoles();
            setRoles(data);
        } catch (error) {
            console.error('Error loading roles:', error);
            toast.error('Error al cargar los roles');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRole = (role: RoleWithMemberCount) => {
        setSelectedRole(role);
        setName(role.name);
        setDescription(role.description || '');
        setPermissions(role.permissions);
        setApprovalLimits(role.approval_limits || { expenses: 0, sales: 0 });
        setIsEditing(true);
        setUserSearch('');
        setSearchResults([]);
        loadAssignedUsers(role.id);
        loadCostCenterAccess();
    };

    const handleCreateNew = () => {
        setSelectedRole(null);
        setName('');
        setDescription('');
        setPermissions([]);
        setApprovalLimits({ expenses: 0, sales: 0 });
        setIsEditing(true);
        setAssignedUsers([]);
        setUserSearch('');
        setSearchResults([]);
        setCostCenterAccess([]);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('El nombre del rol es obligatorio');
            return;
        }

        try {
            setIsSaving(true);
            const roleData = {
                name,
                description,
                permissions,
                approval_limits: approvalLimits
            };

            if (selectedRole) {
                await roleService.updateRole(selectedRole.id, roleData);
                toast.success('Rol actualizado correctamente');
            } else {
                await roleService.createRole(roleData);
                toast.success('Rol creado correctamente');
            }

            setIsEditing(false);
            loadRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error('Error al guardar el rol');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await roleService.deleteRole(id);
            toast.success('Rol eliminado correctamente');
            loadRoles();
            if (selectedRole?.id === id) setIsEditing(false);
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar el rol');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 animate-pulse">Cargando gestión de roles...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Lista de Roles */}
            <div className={`lg:col-span-4 space-y-4 ${isEditing && 'hidden lg:block'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        Roles Definidos
                    </h2>
                    <button
                        onClick={handleCreateNew}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        title="Crear nuevo rol"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-3">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            onClick={() => handleSelectRole(role)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                                selectedRole?.id === role.id
                                    ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/20'
                                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-slate-100 flex items-center gap-2">
                                        {role.name}
                                        {role.is_system_role && (
                                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-md font-bold">
                                                Sistema
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-400 line-clamp-1">
                                        {role.description || 'Sin descripción'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                        <Users className="w-3 h-3" />
                                        {role._count?.users || 0}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-slate-500">
                                    {role.permissions.length} permisos asignados
                                </span>
                                {!role.is_system_role && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(role.id);
                                        }}
                                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor de Rol */}
            <div className="lg:col-span-8">
                {isEditing ? (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/60">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {selectedRole ? `Editar Rol: ${selectedRole.name}` : 'Nuevo Rol Personalizado'}
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Configura los permisos granulares y límites de este perfil
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                            {/* Información Básica */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Información General
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 ml-1">Nombre del Rol</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={selectedRole?.is_system_role}
                                            placeholder="Ej: Auditor Externo"
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 ml-1">Descripción</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Breve explicación de las responsabilidades"
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Límites de Aprobación */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Límites de Aprobación (Mensual)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 ml-1 text-red-400/80">Límite Gastos (USD)</label>
                                        <input
                                            type="number"
                                            value={approvalLimits.expenses}
                                            onChange={(e) => setApprovalLimits({ ...approvalLimits, expenses: Number(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 ml-1 text-emerald-400/80">Límite Ventas/Créditos (USD)</label>
                                        <input
                                            type="number"
                                            value={approvalLimits.sales}
                                            onChange={(e) => setApprovalLimits({ ...approvalLimits, sales: Number(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Matriz de Permisos */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                                    Configuración de Permisos
                                </h3>
                                <PermissionMatrix
                                    selectedPermissions={permissions}
                                    onChange={setPermissions}
                                />
                            </section>

                            {/* Usuarios Asignados — solo aplica a roles ya guardados */}
                            {selectedRole && (
                                <section className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Usuarios con este Rol
                                    </h3>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder="Buscar por nombre o correo para asignar..."
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                        />
                                        {userSearch.trim() && (
                                            <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                                {isSearching ? (
                                                    <p className="px-4 py-3 text-xs text-slate-500">Buscando...</p>
                                                ) : searchResults.length === 0 ? (
                                                    <p className="px-4 py-3 text-xs text-slate-500">Sin resultados</p>
                                                ) : (
                                                    searchResults.map((u) => {
                                                        const alreadyAssigned = assignedUsers.some(a => a.id === u.id);
                                                        return (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                disabled={alreadyAssigned || isAssigning}
                                                                onClick={() => handleAssignUser(u.id)}
                                                                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                <span>
                                                                    <span className="block text-sm text-slate-200">{u.full_name || 'Sin nombre'}</span>
                                                                    <span className="block text-xs text-slate-500">{u.email} · {u.role}</span>
                                                                </span>
                                                                {alreadyAssigned ? (
                                                                    <span className="text-[10px] uppercase text-slate-500">Ya asignado</span>
                                                                ) : (
                                                                    <Plus className="w-4 h-4 text-indigo-400 shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {assignedUsers.length === 0 ? (
                                            <p className="text-xs text-slate-500">Ningún usuario tiene este rol todavía.</p>
                                        ) : (
                                            assignedUsers.map((u) => {
                                                const userCostCenters = costCenterAccess.filter(a => a.user_id === u.id);
                                                const availableCostCenters = centrosCosto.filter(
                                                    o => !userCostCenters.some(cc => cc.cost_center === o.etiqueta)
                                                );
                                                return (
                                                    <div key={u.id} className="px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                                                        <div className="flex items-center justify-between">
                                                            <span>
                                                                <span className="block text-sm text-slate-200">{u.full_name || 'Sin nombre'}</span>
                                                                <span className="block text-xs text-slate-500">{u.email} · {u.role}</span>
                                                            </span>
                                                            <button
                                                                onClick={() => handleRemoveUser(u.id)}
                                                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                                                title="Quitar rol"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {showCostCenterControls && (
                                                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-800">
                                                                {userCostCenters.length === 0 && (
                                                                    <span className="text-[11px] text-amber-500/80">Sin centro de costo — no verá ninguna cotización todavía</span>
                                                                )}
                                                                {userCostCenters.map((cc) => (
                                                                    <span key={cc.id} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[11px] font-medium text-indigo-300">
                                                                        {cc.cost_center}
                                                                        <button onClick={() => handleRevokeCostCenter(cc.id)} className="text-indigo-400/70 hover:text-red-400 transition-colors">
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                                {availableCostCenters.length > 0 && (
                                                                    <select
                                                                        value=""
                                                                        onChange={(e) => { if (e.target.value) handleGrantCostCenter(u.id, e.target.value); }}
                                                                        className="text-[11px] bg-slate-800 border border-slate-700 rounded-full px-2 py-1 text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                    >
                                                                        <option value="">+ Centro de costo</option>
                                                                        {availableCostCenters.map((o) => (
                                                                            <option key={o.valor} value={o.etiqueta}>{o.etiqueta}</option>
                                                                        ))}
                                                                    </select>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    {showCostCenterControls && (
                                        <p className="text-[11px] text-slate-500">
                                            Este rol tiene &quot;Ver cotizaciones propias&quot; sin &quot;Ver todas&quot;: cada persona solo verá cotizaciones del centro de costo que le habilites aquí (de cualquier autor).
                                        </p>
                                    )}
                                </section>
                            )}
                        </div>

                        {/* Footer de Acciones */}
                        <div className="p-6 bg-slate-800/80 border-t border-slate-700/50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-3xl">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-slate-700">
                            <Shield className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300">Gestión de Seguridad</h3>
                        <p className="text-slate-500 mt-2 max-w-sm">
                            Selecciona un rol de la lista para ver o modificar sus capacidades, o crea un nuevo perfil de acceso personalizado.
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="mt-8 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex items-center gap-2 group"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
                            Crear Nuevo Rol
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
