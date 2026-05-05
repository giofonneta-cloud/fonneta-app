'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '../store/authStore';

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { fetchProfile, setProfile, refreshProfile } = useAuthStore();

    useEffect(() => {
        // Carga inicial del perfil
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        // Refresca el perfil cuando la tab vuelve a ser visible
        // Esto permite que cambios de rol hechos por un admin se reflejen sin logout
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshProfile();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Escucha cambios de auth (login, logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchProfile, setProfile, refreshProfile]);

    return <>{children}</>;
}
