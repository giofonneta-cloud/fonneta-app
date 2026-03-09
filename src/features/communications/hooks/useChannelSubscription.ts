'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useCommunicationsStore } from '../store';
import type { Message } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useChannelSubscription(channelId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const addMessage = useCommunicationsStore((state) => state.addMessage);
  const updateMessage = useCommunicationsStore((state) => state.updateMessage);

  useEffect(() => {
    if (!channelId) return;

    const realtimeChannel = supabase.channel(`messages:${channelId}`, {
      config: { broadcast: { self: false } }
    });

    realtimeChannel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        addMessage(payload as Message);
      })
      .on('broadcast', { event: 'edit_message' }, ({ payload }) => {
        updateMessage(payload.id, payload);
      })
      .on('broadcast', { event: 'delete_message' }, ({ payload }) => {
        updateMessage(payload.id, { is_deleted: true });
      })
      .subscribe();

    channelRef.current = realtimeChannel;

    return () => {
      supabase.removeChannel(realtimeChannel);
      channelRef.current = null;
    };
  }, [channelId, addMessage, updateMessage]);

  const broadcastNewMessage = useCallback(async (message: Message) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'new_message',
      payload: message
    });
  }, []);

  const broadcastEditMessage = useCallback(async (message: Message) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'edit_message',
      payload: message
    });
  }, []);

  const broadcastDeleteMessage = useCallback(async (messageId: string) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'delete_message',
      payload: { id: messageId }
    });
  }, []);

  return {
    broadcastNewMessage,
    broadcastEditMessage,
    broadcastDeleteMessage
  };
}
