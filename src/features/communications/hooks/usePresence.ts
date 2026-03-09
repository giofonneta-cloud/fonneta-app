'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/shared/lib/supabase';
import type { PresenceState, UserStatus, PresenceUser } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function usePresence(serverId: string | null) {
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!serverId) return;

    const presenceChannel = supabase.channel(`presence:${serverId}`, {
      config: { presence: { key: 'user_id' } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<PresenceUser>();
        setPresenceState(state);

        // Flatten presence state to array of online users
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (!users.find((u) => u.user_id === presence.user_id)) {
              users.push(presence);
            }
          });
        });
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('username')
              .eq('id', user.id)
              .single();

            await presenceChannel.track({
              user_id: user.id,
              username: profile?.username || user.email?.split('@')[0] || 'Anonymous',
              status: 'online' as UserStatus,
              online_at: new Date().toISOString()
            });
          }
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      channelRef.current = null;
    };
  }, [serverId]);

  const updateStatus = useCallback(async (status: UserStatus) => {
    if (!channelRef.current) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      await channelRef.current.track({
        user_id: user.id,
        username: profile?.username || user.email?.split('@')[0] || 'Anonymous',
        status,
        online_at: new Date().toISOString()
      });
    }
  }, []);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.some((u) => u.user_id === userId);
  }, [onlineUsers]);

  const getUserStatus = useCallback((userId: string): UserStatus => {
    const user = onlineUsers.find((u) => u.user_id === userId);
    return user?.status || 'offline';
  }, [onlineUsers]);

  return {
    presenceState,
    onlineUsers,
    updateStatus,
    isUserOnline,
    getUserStatus
  };
}
