import { supabase } from '@/shared/lib/supabase';
import type { Message, MessageWithAuthor } from '../types';

const PAGE_SIZE = 50;

export const messageService = {
  async getMessages(
    channelId: string,
    cursor?: string
  ): Promise<{ messages: MessageWithAuthor[]; nextCursor: string | null }> {
    let query = supabase
      .from('messages')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const messages = (data || []).reverse();
    const nextCursor = data && data.length === PAGE_SIZE
      ? data[data.length - 1].created_at
      : null;

    return { messages: messages as MessageWithAuthor[], nextCursor };
  },

  async sendMessage(
    channelId: string,
    content: string,
    replyToId?: string
  ): Promise<MessageWithAuthor> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content,
        reply_to_id: replyToId || null
      })
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .single();

    if (error) throw error;
    return data as MessageWithAuthor;
  },

  async editMessage(messageId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update({ content, is_edited: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (error) throw error;
  },

  async getMessageById(messageId: string): Promise<MessageWithAuthor> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return data as MessageWithAuthor;
  }
};
