export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  custom_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface PresenceUser {
  user_id: string;
  username: string;
  status: UserStatus;
  typing?: boolean;
  last_seen?: string;
}

export interface PresenceState {
  [key: string]: PresenceUser[];
}
