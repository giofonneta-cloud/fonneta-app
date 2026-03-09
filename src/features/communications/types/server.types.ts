import type { UserProfile } from './user.types';
import type { Role } from './role.types';
import type { Channel } from './channel.types';

export interface Server {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role_id: string | null;
  nickname: string | null;
  joined_at: string;
  user_profile?: UserProfile;
  role?: Role;
}

export interface ServerWithDetails extends Server {
  members: ServerMember[];
  channels: Channel[];
}
