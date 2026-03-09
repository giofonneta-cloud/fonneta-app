import type { UserProfile } from './user.types';

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  reply_to?: Message;
}

export interface MessageWithAuthor extends Message {
  user_profile: UserProfile;
}

export interface Mention {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  is_read: boolean;
  created_at: string;
}
