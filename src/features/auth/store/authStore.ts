import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { AuthState, Profile } from '../types/auth.types';
import type { Permission } from '@/shared/types/permissions';

const supabase = createClient();

interface AuthActions {
    setProfile: (profile: Profile | null) => void;
    fetchProfile: (userId: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
    hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
    profile: null,
    isLoading: true,
    error: null,

    setProfile: (profile: Profile | null) => set({ profile, isLoading: false }),

    fetchProfile: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            // Obtener perfil base
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // Obtener roles dinámicos
            const { data: userRoles, error: rolesError } = await supabase
                .from('user_app_roles')
                .select('role:app_roles(*)')
                .eq('user_id', userId);

            if (rolesError) throw rolesError;

            const roles = (userRoles?.map(ur => ur.role) || []) as any[];
            const permissions = Array.from(new Set(roles.flatMap(r => r.permissions || [])));

            set({ 
                profile: { 
                    ...(profile as Profile), 
                    roles, 
                    permissions 
                }, 
                isLoading: false 
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    refreshProfile: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            const { data: userRoles } = await supabase
                .from('user_app_roles')
                .select('role:app_roles(*)')
                .eq('user_id', session.user.id);

            if (profile) {
                const roles = (userRoles?.map(ur => ur.role) || []) as any[];
                const permissions = Array.from(new Set(roles.flatMap(r => r.permissions || [])));
                
                set({ 
                    profile: { 
                        ...(profile as Profile), 
                        roles, 
                        permissions 
                    } 
                });
            }
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ profile: null });
    },

    hasPermission: (permission: Permission) => {
        const profile = get().profile;
        if (!profile) return false;
        // Admins del sistema tienen superpoderes por ahora para evitar bloqueos
        if (profile.role === 'admin') return true;
        return profile.permissions?.includes(permission) || false;
    },
}));
