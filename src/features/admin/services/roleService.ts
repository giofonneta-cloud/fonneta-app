import { supabase } from '@/shared/lib/supabase';
import { AppRole, RoleWithMemberCount } from '../types/role.types';

export const roleService = {
    /**
     * Obtiene todos los roles definidos en el sistema
     */
    async getAllRoles(): Promise<RoleWithMemberCount[]> {
        const { data, error } = await supabase
            .from('app_roles')
            .select(`
                *,
                user_app_roles(count)
            `)
            .order('name');

        if (error) throw error;

        return data.map(role => ({
            ...role,
            _count: {
                users: role.user_app_roles?.[0]?.count || 0
            }
        }));
    },

    /**
     * Obtiene un rol por ID
     */
    async getRoleById(id: string): Promise<AppRole> {
        const { data, error } = await supabase
            .from('app_roles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Crea un nuevo rol
     */
    async createRole(role: Omit<AppRole, 'id' | 'created_at' | 'updated_at' | 'is_system_role'>): Promise<AppRole> {
        const { data, error } = await supabase
            .from('app_roles')
            .insert(role)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Actualiza un rol existente
     */
    async updateRole(id: string, updates: Partial<AppRole>): Promise<AppRole> {
        const { data, error } = await supabase
            .from('app_roles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Elimina un rol (si no es del sistema)
     */
    async deleteRole(id: string): Promise<void> {
        // Verificar primero si es un rol del sistema
        const { data: role } = await supabase
            .from('app_roles')
            .select('is_system_role')
            .eq('id', id)
            .single();

        if (role?.is_system_role) {
            throw new Error('No se pueden eliminar roles protegidos del sistema.');
        }

        const { error } = await supabase
            .from('app_roles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Asigna un rol a un usuario
     */
    async assignRoleToUser(userId: string, roleId: string): Promise<void> {
        const { error } = await supabase
            .from('user_app_roles')
            .upsert({ user_id: userId, role_id: roleId });

        if (error) throw error;
    },

    /**
     * Obtiene los roles de un usuario
     */
    async getUserRoles(userId: string): Promise<AppRole[]> {
        const { data, error } = await supabase
            .from('user_app_roles')
            .select('role:app_roles(*)')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(item => item.role as unknown as AppRole);
    },

    /**
     * Usuarios que tienen un rol específico asignado
     */
    async getUsersForRole(roleId: string): Promise<{ id: string; full_name: string | null; email: string; role: string }[]> {
        const { data, error } = await supabase
            .from('user_app_roles')
            .select('profiles:user_id (id, full_name, email, role)')
            .eq('role_id', roleId);

        if (error) throw error;
        return (data ?? [])
            .map(row => row.profiles as unknown as { id: string; full_name: string | null; email: string; role: string } | null)
            .filter((p): p is { id: string; full_name: string | null; email: string; role: string } => p !== null);
    },

    /**
     * Quita un rol de un usuario
     */
    async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
        const { error } = await supabase
            .from('user_app_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role_id', roleId);

        if (error) throw error;
    },

    /**
     * Busca usuarios por nombre o email (para asignar roles)
     */
    async searchUsers(query: string): Promise<{ id: string; full_name: string | null; email: string; role: string }[]> {
        if (!query.trim()) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;
        return data ?? [];
    }
};
