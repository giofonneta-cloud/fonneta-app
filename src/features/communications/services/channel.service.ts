import { supabase } from '@/shared/lib/supabase';
import type { Channel, ChannelType } from '../types';

export const channelService = {
  async getChannelsByServer(serverId: string): Promise<Channel[]> {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('server_id', serverId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getChannelById(channelId: string): Promise<Channel> {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) throw error;
    return data;
  },

  async createChannel(
    serverId: string,
    name: string,
    type: ChannelType = 'text',
    description?: string
  ): Promise<Channel> {
    // Obtener posicion maxima
    const { data: channels } = await supabase
      .from('channels')
      .select('position')
      .eq('server_id', serverId)
      .order('position', { ascending: false })
      .limit(1);

    const position = channels && channels.length > 0 ? channels[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('channels')
      .insert({
        server_id: serverId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        type,
        position
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateChannel(
    channelId: string,
    updates: Partial<Pick<Channel, 'name' | 'description' | 'is_private'>>
  ): Promise<Channel> {
    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', channelId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteChannel(channelId: string): Promise<void> {
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId);

    if (error) throw error;
  },

  async reorderChannels(channelIds: string[]): Promise<void> {
    const updates = channelIds.map((id, index) => ({
      id,
      position: index
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('channels')
        .update({ position: update.position })
        .eq('id', update.id);

      if (error) throw error;
    }
  }
};
