import { supabase } from '@/shared/lib/supabase';
import { Channel, Message } from '../types/chat.types';

export const chatService = {
    async getChannels() {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Channel[];
    },

    async getMessages(channelId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*, author:profiles(full_name, avatar_url, role)')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Message[];
    },

    async sendMessage(channelId: string, authorId: string, content: string) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                channel_id: channelId,
                author_id: authorId,
                content
            })
            .select('*, author:profiles(full_name, avatar_url, role)')
            .single();

        if (error) throw error;
        return data as Message;
    },

    subscribeToMessages(channelId: string, onMessage: (message: Message) => void) {
        return supabase
            .channel(`public:messages:channel_id=eq.${channelId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `channel_id=eq.${channelId}`
                },
                async (payload) => {
                    // Fetch the message with author details because payload only has raw columns
                    const { data } = await supabase
                        .from('messages')
                        .select('*, author:profiles(full_name, avatar_url, role)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) onMessage(data as Message);
                }
            )
            .subscribe();
    }
};
