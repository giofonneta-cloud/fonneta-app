import { supabase } from '@/shared/lib/supabase';
import type { UserProfile, UserStatus } from '../types';

export const profileService = {
  async getMyProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getProfileById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getProfilesByIds(userIds: string[]): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  },

  async updateProfile(updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url' | 'custom_status'>>): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(status: UserStatus): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update({ status })
      .eq('id', user.id);

    if (error) throw error;
  },

  async searchProfiles(query: string, limit = 10): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async ensureProfile(): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Intentar obtener perfil existente
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existing) return existing;

    // Crear perfil si no existe
    const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        username,
        display_name: username
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
