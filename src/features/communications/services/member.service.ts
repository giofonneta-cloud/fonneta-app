import { supabase } from '@/shared/lib/supabase';
import type { ServerMember } from '../types';

export const memberService = {
  async getMembersByServer(serverId: string): Promise<ServerMember[]> {
    const { data, error } = await supabase
      .from('server_members')
      .select(`
        *,
        user_profile:user_profiles(*),
        role:roles(*)
      `)
      .eq('server_id', serverId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getMember(serverId: string, userId: string): Promise<ServerMember | null> {
    const { data, error } = await supabase
      .from('server_members')
      .select(`
        *,
        user_profile:user_profiles(*),
        role:roles(*)
      `)
      .eq('server_id', serverId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateNickname(serverId: string, nickname: string | null): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('server_members')
      .update({ nickname })
      .eq('server_id', serverId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async assignRole(serverId: string, userId: string, roleId: string | null): Promise<void> {
    const { error } = await supabase
      .from('server_members')
      .update({ role_id: roleId })
      .eq('server_id', serverId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async kickMember(serverId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('server_members')
      .delete()
      .eq('server_id', serverId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};
