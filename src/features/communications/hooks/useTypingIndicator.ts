'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
  user_id: string;
  username: string;
}

export function useTypingIndicator(channelId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!channelId) return;

    const typingChannel = supabase.channel(`typing:${channelId}`, {
      config: { broadcast: { self: false } }
    });

    typingChannel
      .on('broadcast', { event: 'typing_start' }, ({ payload }) => {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.user_id === payload.user_id)) return prev;
          return [...prev, payload as TypingUser];
        });

        // Auto-remove after 3 seconds if no stop event
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.user_id !== payload.user_id));
        }, 3000);
      })
      .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
        setTypingUsers((prev) => prev.filter((u) => u.user_id !== payload.user_id));
      })
      .subscribe();

    channelRef.current = typingChannel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(typingChannel);
      channelRef.current = null;
    };
  }, [channelId]);

  const startTyping = useCallback(async () => {
    if (!channelRef.current || isTypingRef.current) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    isTypingRef.current = true;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing_start',
      payload: {
        user_id: user.id,
        username: profile?.username || user.email?.split('@')[0] || 'Anonymous'
      }
    });

    // Auto-stop typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      await stopTyping();
    }, 2000);
  }, []);

  const stopTyping = useCallback(async () => {
    if (!channelRef.current || !isTypingRef.current) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing_stop',
      payload: { user_id: user.id }
    });
  }, []);

  return { typingUsers, startTyping, stopTyping };
}
