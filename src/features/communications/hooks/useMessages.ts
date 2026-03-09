'use client';

import { useState, useCallback, useEffect } from 'react';
import { messageService } from '../services';
import { useCommunicationsStore } from '../store';
import { useChannelSubscription } from './useChannelSubscription';
import type { Message } from '../types';

export function useMessages(channelId: string | null) {
  const [error, setError] = useState<Error | null>(null);

  const {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    prependMessages,
    isLoadingMessages,
    setLoadingMessages,
    messageCursor,
    setMessageCursor,
    hasMoreMessages
  } = useCommunicationsStore();

  const { broadcastNewMessage, broadcastEditMessage, broadcastDeleteMessage } = useChannelSubscription(channelId);

  // Cargar mensajes iniciales
  useEffect(() => {
    if (!channelId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);

      try {
        const { messages: loadedMessages, nextCursor } = await messageService.getMessages(channelId);
        setMessages(loadedMessages);
        setMessageCursor(nextCursor);
      } catch (err) {
        setError(err as Error);
        console.error('Error loading messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [channelId, setMessages, setMessageCursor, setLoadingMessages]);

  // Cargar mas mensajes (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!channelId || !messageCursor || isLoadingMessages) return;

    setLoadingMessages(true);
    try {
      const { messages: olderMessages, nextCursor } = await messageService.getMessages(channelId, messageCursor);
      prependMessages(olderMessages);
      setMessageCursor(nextCursor);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [channelId, messageCursor, isLoadingMessages, prependMessages, setMessageCursor, setLoadingMessages]);

  // Enviar mensaje
  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    if (!channelId || !content.trim()) return;

    try {
      const message = await messageService.sendMessage(channelId, content.trim(), replyToId);
      addMessage(message);
      await broadcastNewMessage(message);
      return message;
    } catch (err) {
      setError(err as Error);
      console.error('Error sending message:', err);
      throw err;
    }
  }, [channelId, addMessage, broadcastNewMessage]);

  // Editar mensaje
  const editMessage = useCallback(async (messageId: string, content: string) => {
    try {
      const updated = await messageService.editMessage(messageId, content);
      updateMessage(messageId, updated);
      await broadcastEditMessage(updated as Message);
      return updated;
    } catch (err) {
      setError(err as Error);
      console.error('Error editing message:', err);
      throw err;
    }
  }, [updateMessage, broadcastEditMessage]);

  // Eliminar mensaje
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId);
      updateMessage(messageId, { is_deleted: true });
      await broadcastDeleteMessage(messageId);
    } catch (err) {
      setError(err as Error);
      console.error('Error deleting message:', err);
      throw err;
    }
  }, [updateMessage, broadcastDeleteMessage]);

  return {
    messages,
    isLoading: isLoadingMessages,
    error,
    hasMoreMessages,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage
  };
}
