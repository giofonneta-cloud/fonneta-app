'use client';

import { useState } from 'react';
import { useServers } from '../../hooks';
import { ServerIcon } from './ServerIcon';
import { CreateServerModal } from './CreateServerModal';
import { JoinServerModal } from './JoinServerModal';
import { LoadingSpinner } from '../shared';

export function ServerList() {
  const { servers, currentServerId, isLoading, selectServer } = useServers();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 py-3">
        {/* Home button */}
        <button
          onClick={() => selectServer(servers[0]?.id || '')}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-blue-600 hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </button>

        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-700 rounded-full my-1" />

        {/* Server list */}
        {servers.map((server) => (
          <ServerIcon
            key={server.id}
            server={server}
            isActive={server.id === currentServerId}
            onClick={() => selectServer(server.id)}
          />
        ))}

        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-700 rounded-full my-1" />

        {/* Add server button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-600 hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-green-500 hover:text-white group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Join server button */}
        <button
          onClick={() => setShowJoinModal(true)}
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-600 hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-green-500 hover:text-white group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </button>
      </div>

      {showCreateModal && <CreateServerModal onClose={() => setShowCreateModal(false)} />}
      {showJoinModal && <JoinServerModal onClose={() => setShowJoinModal(false)} />}
    </>
  );
}
