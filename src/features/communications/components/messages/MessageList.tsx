'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useMessages, useChannels } from '../../hooks';
import { useCommunicationsStore } from '../../store';
import { MessageItem } from './MessageItem';
import { LoadingSpinner } from '../shared';
import type { MessageWithAuthor } from '../../types';

export function MessageList() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const { currentChannel, currentChannelId } = useChannels();
  const currentUser = useCommunicationsStore((state) => state.currentUser);
  const { messages, isLoading, hasMoreMessages, loadMore, deleteMessage } = useMessages(currentChannelId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Infinite scroll - load more when scrolling to top
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isLoading || !hasMoreMessages) return;

    if (scrollRef.current.scrollTop < 100) {
      loadMore();
    }
  }, [isLoading, hasMoreMessages, loadMore]);

  // Check if messages should be grouped (same author, within 5 minutes)
  const shouldGroupMessage = (message: typeof messages[0], prevMessage: typeof messages[0] | undefined) => {
    if (!prevMessage) return false;
    if (message.user_id !== prevMessage.user_id) return false;

    const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
    return timeDiff < 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Channel Header */}
      <div className="h-12 px-4 flex items-center border-b border-gray-900/50 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <h3 className="font-semibold text-white">{currentChannel?.name || 'Canal'}</h3>
        </div>
        {currentChannel?.description && (
          <>
            <div className="w-px h-6 bg-gray-700 mx-3" />
            <p className="text-sm text-gray-400 truncate">{currentChannel.description}</p>
          </>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div ref={topRef} />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {/* Load more indicator */}
        {hasMoreMessages && !isLoading && (
          <div className="text-center py-4">
            <button
              onClick={loadMore}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Cargar mensajes anteriores
            </button>
          </div>
        )}

        {/* Welcome message */}
        {!hasMoreMessages && messages.length > 0 && (
          <div className="px-4 py-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Bienvenido a #{currentChannel?.name}
            </h2>
            <p className="text-gray-400">
              Este es el inicio de #{currentChannel?.name}.
              {currentChannel?.description && ` ${currentChannel.description}`}
            </p>
          </div>
        )}

        {/* Messages list */}
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const isGrouped = shouldGroupMessage(message, prevMessage);
          const isOwn = message.user_id === currentUser?.id;

          return (
            <MessageItem
              key={message.id}
              message={message as MessageWithAuthor}
              isGrouped={isGrouped}
              isOwn={isOwn}
              onDelete={isOwn ? deleteMessage : undefined}
            />
          );
        })}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-center">
              No hay mensajes aun.<br />
              Se el primero en escribir algo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
