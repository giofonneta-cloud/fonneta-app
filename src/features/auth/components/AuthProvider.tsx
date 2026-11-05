'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
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

    // El login es una server action: guarda la sesión en cookies y redirige sin recargar,
    // así que este provider (montado desde /login) no recibe ningún evento de auth.
    // Al cambiar de ruta sin perfil cargado, se vuelve a leer la sesión.
    const pathname = usePathname();
    useEffect(() => {
        if (useAuthStore.getState().profile) return;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && !useAuthStore.getState().profile) {
                fetchProfile(session.user.id);
            }
        });
    }, [pathname, fetchProfile]);

    return <>{children}</>;
}
