import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { AuthState, Profile } from '../types/auth.types';
import type { Permission } from '@/shared/types/permissions';

const supabase = createClient();
const inFlightFetches = new Map<string, Promise<void>>();

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
        // Si ya hay un perfil cargado, es un refresco en segundo plano (p. ej. al volver a la pestaña):
        // no activar isLoading, porque las páginas que hacen `if (isLoading) return null`
        // desmontarían sus formularios y se perdería lo que el usuario estaba digitando.
        if (get().profile) {
            set({ error: null });
        } else {
            set({ isLoading: true, error: null });
        }
        // AuthProvider la dispara dos veces al abrir (getSession + onAuthStateChange):
        // si ya hay una carga en curso para este usuario, se reutiliza.
        const pending = inFlightFetches.get(userId);
        if (pending) return pending;

        const run = (async () => {
        try {
            // Perfil y roles en paralelo: no dependen entre sí
            const [
                { data: profile, error: profileError },
                { data: userRoles, error: rolesError },
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('user_app_roles').select('role:app_roles(*)').eq('user_id', userId),
            ]);

            if (profileError) throw profileError;
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
        })();

        inFlightFetches.set(userId, run);
        try {
            await run;
        } finally {
            inFlightFetches.delete(userId);
        }
    },

    refreshProfile: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        try {
            const [{ data: profile }, { data: userRoles }] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                supabase.from('user_app_roles').select('role:app_roles(*)').eq('user_id', session.user.id),
            ]);

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
