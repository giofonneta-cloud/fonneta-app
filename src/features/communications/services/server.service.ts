import { supabase } from '@/shared/lib/supabase';
import type { Server, ServerWithDetails } from '../types';

export const serverService = {
  async getMyServers(): Promise<Server[]> {
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getServerById(serverId: string): Promise<ServerWithDetails> {
    const { data, error } = await supabase
      .from('servers')
      .select(`
        *,
        channels(*),
        server_members(
          *,
          user_profile:user_profiles(*)
        )
      `)
      .eq('id', serverId)
      .single();

    if (error) throw error;
    return {
      ...data,
      members: data.server_members || [],
      channels: data.channels || []
    };
  },

  async createServer(name: string, description?: string): Promise<Server> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('servers')
      .insert({ name, description, owner_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateServer(serverId: string, updates: Partial<Pick<Server, 'name' | 'description' | 'icon_url'>>): Promise<Server> {
    const { data, error } = await supabase
      .from('servers')
      .update(updates)
      .eq('id', serverId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteServer(serverId: string): Promise<void> {
    const { error } = await supabase
      .from('servers')
      .delete()
      .eq('id', serverId);

    if (error) throw error;
  },

  async joinByInviteCode(inviteCode: string): Promise<Server> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Buscar servidor
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (serverError || !server) throw new Error('Codigo de invitacion invalido');

    // Verificar si ya es miembro
    const { data: existing } = await supabase
      .from('server_members')
      .select('id')
      .eq('server_id', server.id)
      .eq('user_id', user.id)
      .single();

    if (existing) throw new Error('Ya eres miembro de este servidor');

    // Unirse
    const { error: joinError } = await supabase
      .from('server_members')
      .insert({ server_id: server.id, user_id: user.id });

    if (joinError) throw joinError;
    return server;
  },

  async leaveServer(serverId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('server_members')
      .delete()
      .eq('server_id', serverId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async regenerateInviteCode(serverId: string): Promise<string> {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data, error } = await supabase
      .from('servers')
      .update({ invite_code: newCode })
      .eq('id', serverId)
      .select('invite_code')
      .single();

    if (error) throw error;
    return data.invite_code;
  }
};
