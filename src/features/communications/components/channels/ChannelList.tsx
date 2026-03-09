'use client';

import { useState } from 'react';
import { useChannels } from '../../hooks';
import { useCommunicationsStore } from '../../store';
import { ChannelItem } from './ChannelItem';
import { CreateChannelModal } from './CreateChannelModal';

export function ChannelList() {
  const { channels, currentChannelId, selectChannel } = useChannels();
  const servers = useCommunicationsStore((state) => state.servers);
  const currentServerId = useCommunicationsStore((state) => state.currentServerId);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currentServer = servers.find((s) => s.id === currentServerId);

  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');

  return (
    <>
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-gray-900/50 shadow-sm">
        <h2 className="font-semibold text-white truncate">
          {currentServer?.name || 'Servidor'}
        </h2>
        <button className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {/* Text Channels */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Canales de texto
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {textChannels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === currentChannelId}
              onClick={() => selectChannel(channel.id)}
            />
          ))}
        </div>

        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Canales de voz
              </span>
            </div>
            {voiceChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={channel.id === currentChannelId}
                onClick={() => selectChannel(channel.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Area */}
      <UserArea />

      {showCreateModal && <CreateChannelModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}

function UserArea() {
  const currentUser = useCommunicationsStore((state) => state.currentUser);

  if (!currentUser) return null;

  return (
    <div className="h-14 px-2 flex items-center gap-2 bg-gray-900/50">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
        {currentUser.username?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {currentUser.display_name || currentUser.username}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {currentUser.custom_status || 'En linea'}
        </p>
      </div>
      <button className="text-gray-400 hover:text-white p-1">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
