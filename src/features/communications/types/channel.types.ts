export type ChannelType = 'text' | 'voice' | 'announcement';

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  description: string | null;
  type: ChannelType;
  position: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}
