export type ChannelType = 'proyecto' | 'cliente' | 'proveedor' | 'general' | 'finanzas' | 'dm';

export interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    description: string | null;
    project_id: string | null;
    provider_id: string | null;
    is_private: boolean;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    channel_id: string;
    author_id: string;
    content: string;
    parent_id: string | null;
    is_system: boolean;
    created_at: string;
    author?: {
        full_name: string;
        avatar_url: string;
        role: string;
    };
}
