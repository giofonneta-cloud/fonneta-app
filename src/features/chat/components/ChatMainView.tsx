'use client';

import { useState, useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { useChat } from '../hooks/useChat';
import { chatService } from '../services/chatService';
import { Channel } from '../types/chat.types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function ChatMainView() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const { messages, isLoading, sendMessage } = useChat(activeChannelId);
    const { profile } = useAuthStore();

    useEffect(() => {
        chatService.getChannels().then(data => {
            setChannels(data);
            if (data.length > 0) setActiveChannelId(data[0].id);
        });
    }, []);

    const activeChannel = channels.find(c => c.id === activeChannelId) || null;

    return (
        <div className="flex bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden h-[calc(100vh-200px)]">
            <ChatSidebar
                channels={channels}
                activeChannelId={activeChannelId}
                onChannelSelect={setActiveChannelId}
            />
            <ChatWindow
                channel={activeChannel}
                messages={messages}
                onSendMessage={(content) => profile && sendMessage(profile.id, content)}
            />
        </div>
    );
}
