'use client';

import type { ServerMember, UserStatus } from '../../types';
import { Avatar } from '../shared';

interface MemberItemProps {
  member: ServerMember;
  status?: UserStatus;
}

export function MemberItem({ member, status = 'offline' }: MemberItemProps) {
  const profile = member.user_profile;
  const displayName = member.nickname || profile?.display_name || profile?.username || 'Usuario';

  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-700/30 cursor-pointer transition-colors">
      <Avatar
        src={profile?.avatar_url}
        fallback={displayName[0]}
        size="sm"
        status={status}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            status === 'offline' ? 'text-gray-500' : 'text-gray-300'
          }`}
          style={member.role?.color ? { color: member.role.color } : undefined}
        >
          {displayName}
        </p>
        {profile?.custom_status && (
          <p className="text-xs text-gray-500 truncate">{profile.custom_status}</p>
        )}
      </div>
    </div>
  );
}
