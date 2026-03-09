'use client';

import { useEffect } from 'react';
import { useCommunicationsStore } from '../../store';
import { useServers } from '../../hooks';
import { ServerList } from '../servers';
import { ChannelList } from '../channels';
import { MessageList, MessageInput } from '../messages';
import { MemberList } from '../members';
import { LoadingSpinner } from '../shared';

export function CommunicationsLayout() {
  const { currentServerId, isLoading } = useServers();
  const currentChannelId = useCommunicationsStore((state) => state.currentChannelId);
  const isMemberListOpen = useCommunicationsStore((state) => state.isMemberListOpen);

  if (isLoading) {
    return (
      <div className="flex h-full bg-gray-900 items-center justify-center rounded-2xl">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900 overflow-hidden rounded-2xl">
      {/* Server List - Fixed 72px */}
      <aside className="w-[72px] bg-gray-950 flex flex-col items-center overflow-y-auto flex-shrink-0">
        <ServerList />
      </aside>

      {/* Channel Sidebar - 240px */}
      {currentServerId && (
        <aside className="w-60 bg-gray-800/50 backdrop-blur-xl border-r border-white/10 flex flex-col flex-shrink-0">
          <ChannelList />
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-gray-900 min-w-0">
        {currentChannelId ? (
          <>
            <MessageList />
            <MessageInput />
          </>
        ) : currentServerId ? (
          <EmptyChannel />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Member List - 240px */}
      {currentServerId && isMemberListOpen && (
        <aside className="w-60 bg-gray-800/30 backdrop-blur-xl border-l border-white/10 flex-shrink-0">
          <MemberList />
        </aside>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a Comunicaciones</h2>
      <p className="text-gray-400 max-w-md mb-6">
        Crea un servidor o unete a uno existente para comenzar a chatear con tu equipo.
      </p>
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          Crear servidor
        </button>
        <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
          Unirse a servidor
        </button>
      </div>
    </div>
  );
}

function EmptyChannel() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
      <p>Selecciona un canal para comenzar</p>
    </div>
  );
}
