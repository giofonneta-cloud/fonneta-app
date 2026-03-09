'use client';

import { useState, useCallback } from 'react';
import { channelService } from '../services';
import { useCommunicationsStore } from '../store';
import type { ChannelType } from '../types';

export function useChannels() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    channels,
    currentChannelId,
    currentServerId,
    setCurrentChannel,
    addChannel,
    updateChannel,
    removeChannel
  } = useCommunicationsStore();

  // Seleccionar canal
  const selectChannel = useCallback((channelId: string) => {
    setCurrentChannel(channelId);
  }, [setCurrentChannel]);

  // Crear canal
  const createChannel = useCallback(async (
    name: string,
    type: ChannelType = 'text',
    description?: string
  ) => {
    if (!currentServerId) {
      throw new Error('No server selected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const channel = await channelService.createChannel(currentServerId, name, type, description);
      addChannel(channel);
      return channel;
    } catch (err) {
      setError(err as Error);
      console.error('Error creating channel:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentServerId, addChannel]);

  // Actualizar canal
  const editChannel = useCallback(async (
    channelId: string,
    updates: { name?: string; description?: string; is_private?: boolean }
  ) => {
    setError(null);

    try {
      const updated = await channelService.updateChannel(channelId, updates);
      updateChannel(channelId, updated);
      return updated;
    } catch (err) {
      setError(err as Error);
      console.error('Error updating channel:', err);
      throw err;
    }
  }, [updateChannel]);

  // Eliminar canal
  const deleteChannel = useCallback(async (channelId: string) => {
    setError(null);

    try {
      await channelService.deleteChannel(channelId);
      removeChannel(channelId);
    } catch (err) {
      setError(err as Error);
      console.error('Error deleting channel:', err);
      throw err;
    }
  }, [removeChannel]);

  // Obtener canal actual
  const currentChannel = channels.find((c) => c.id === currentChannelId);

  return {
    channels,
    currentChannel,
    currentChannelId,
    isLoading,
    error,
    selectChannel,
    createChannel,
    editChannel,
    deleteChannel
  };
}
