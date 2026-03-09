'use client';

import { useState, useCallback, useEffect } from 'react';
import { serverService, channelService, memberService, profileService } from '../services';
import { useCommunicationsStore } from '../store';

export function useServers() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    servers,
    setServers,
    addServer,
    removeServer,
    currentServerId,
    setCurrentServer,
    setChannels,
    setMembers,
    setCurrentUser
  } = useCommunicationsStore();

  // Cargar servidores del usuario
  const loadServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Asegurar que existe el perfil
      const profile = await profileService.ensureProfile();
      setCurrentUser(profile);

      const loadedServers = await serverService.getMyServers();
      setServers(loadedServers);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading servers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setServers, setCurrentUser]);

  // Cargar servidores al montar
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // Seleccionar servidor
  const selectServer = useCallback(async (serverId: string) => {
    setCurrentServer(serverId);
    setError(null);

    try {
      // Cargar canales y miembros
      const [channels, members] = await Promise.all([
        channelService.getChannelsByServer(serverId),
        memberService.getMembersByServer(serverId)
      ]);

      setChannels(channels);
      setMembers(members);

      // Seleccionar primer canal automáticamente
      if (channels.length > 0) {
        useCommunicationsStore.getState().setCurrentChannel(channels[0].id);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error loading server data:', err);
    }
  }, [setCurrentServer, setChannels, setMembers]);

  // Crear servidor
  const createServer = useCallback(async (name: string, description?: string) => {
    setError(null);

    try {
      const server = await serverService.createServer(name, description);
      addServer(server);
      await selectServer(server.id);
      return server;
    } catch (err) {
      setError(err as Error);
      console.error('Error creating server:', err);
      throw err;
    }
  }, [addServer, selectServer]);

  // Unirse a servidor
  const joinServer = useCallback(async (inviteCode: string) => {
    setError(null);

    try {
      const server = await serverService.joinByInviteCode(inviteCode);
      addServer(server);
      await selectServer(server.id);
      return server;
    } catch (err) {
      setError(err as Error);
      console.error('Error joining server:', err);
      throw err;
    }
  }, [addServer, selectServer]);

  // Salir de servidor
  const leaveServer = useCallback(async (serverId: string) => {
    setError(null);

    try {
      await serverService.leaveServer(serverId);
      removeServer(serverId);

      // Si era el servidor actual, limpiar selección
      if (currentServerId === serverId) {
        setCurrentServer(null);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error leaving server:', err);
      throw err;
    }
  }, [removeServer, currentServerId, setCurrentServer]);

  // Eliminar servidor
  const deleteServer = useCallback(async (serverId: string) => {
    setError(null);

    try {
      await serverService.deleteServer(serverId);
      removeServer(serverId);

      if (currentServerId === serverId) {
        setCurrentServer(null);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error deleting server:', err);
      throw err;
    }
  }, [removeServer, currentServerId, setCurrentServer]);

  return {
    servers,
    currentServerId,
    isLoading,
    error,
    loadServers,
    selectServer,
    createServer,
    joinServer,
    leaveServer,
    deleteServer
  };
}
