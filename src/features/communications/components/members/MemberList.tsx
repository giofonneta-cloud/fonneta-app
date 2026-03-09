'use client';

import { useMemo } from 'react';
import { useCommunicationsStore } from '../../store';
import { usePresence } from '../../hooks';
import { MemberItem } from './MemberItem';

export function MemberList() {
  const members = useCommunicationsStore((state) => state.members);
  const currentServerId = useCommunicationsStore((state) => state.currentServerId);
  const { getUserStatus, onlineUsers } = usePresence(currentServerId);

  // Separate online and offline members
  const { onlineMembers, offlineMembers } = useMemo(() => {
    const online: typeof members = [];
    const offline: typeof members = [];

    members.forEach((member) => {
      const status = getUserStatus(member.user_id);
      if (status === 'offline') {
        offline.push(member);
      } else {
        online.push(member);
      }
    });

    return { onlineMembers: online, offlineMembers: offline };
  }, [members, getUserStatus, onlineUsers]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-gray-900/50">
        <h3 className="font-semibold text-gray-400 text-sm">Miembros</h3>
      </div>

      {/* Members list */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {/* Online members */}
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <h4 className="px-2 mb-1 text-xs font-semibold text-gray-500 uppercase">
              En linea — {onlineMembers.length}
            </h4>
            {onlineMembers.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                status={getUserStatus(member.user_id)}
              />
            ))}
          </div>
        )}

        {/* Offline members */}
        {offlineMembers.length > 0 && (
          <div>
            <h4 className="px-2 mb-1 text-xs font-semibold text-gray-500 uppercase">
              Desconectados — {offlineMembers.length}
            </h4>
            {offlineMembers.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                status="offline"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">Sin miembros</p>
          </div>
        )}
      </div>
    </div>
  );
}
