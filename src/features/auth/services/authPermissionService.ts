import { createClient } from '@/lib/supabase/server';
import { Permission } from '@/shared/types/permissions';

/**
 * Servicio para verificar permisos en el servidor (Server Components y API Routes).
 */
export const authPermissionService = {
    /**
     * Verifica si un usuario tiene un permiso específico.
     * @param userId ID del usuario
     * @param permission Permiso a verificar
     * @returns boolean
     */
    async hasPermission(userId: string, permission: Permission): Promise<boolean> {
        const supabase = await createClient();
        
        // 1. Obtener perfil para verificar si es admin legacy
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (profile?.role === 'admin') return true;

        // 2. Obtener roles dinámicos y sus permisos
        const { data: userRoles } = await supabase
            .from('user_app_roles')
            .select('role:app_roles(permissions)')
            .eq('user_id', userId);

        if (!userRoles || userRoles.length === 0) return false;

        // 3. Verificar si algún rol contiene el permiso
        return userRoles.some(ur => {
            const role = ur.role as any;
            return role?.permissions?.includes(permission);
        });
    },

    /**
     * Verifica si el usuario tiene al menos uno de los permisos proporcionados.
     */
    async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
        const supabase = await createClient();
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (profile?.role === 'admin') return true;

        const { data: userRoles } = await supabase
            .from('user_app_roles')
            .select('role:app_roles(permissions)')
            .eq('user_id', userId);

        if (!userRoles) return false;

        return userRoles.some(ur => {
            const role = ur.role as any;
            return role?.permissions?.some((p: Permission) => permissions.includes(p));
        });
    }
};
