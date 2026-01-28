import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import { AuthState, Profile } from '../types/auth.types';

interface AuthActions {
    setProfile: (profile: Profile | null) => void;
    fetchProfile: (userId: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
    profile: null,
    isLoading: true,
    error: null,

    setProfile: (profile: Profile | null) => set({ profile, isLoading: false }),

    fetchProfile: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            set({ profile: data as Profile, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ profile: null });
    },
}));
