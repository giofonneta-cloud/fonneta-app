import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Channel } from '../types/chat.types';
import { chatService } from '../services/chatService';

export function useChat(channelId: string | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = useCallback(async () => {
        if (!channelId) return;
        setIsLoading(true);
        try {
            const data = await chatService.getMessages(channelId);
            setMessages(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [channelId]);

    useEffect(() => {
        fetchMessages();

        if (channelId) {
            const subscription = chatService.subscribeToMessages(channelId, (newMessage) => {
                setMessages(prev => {
                    // Prevent duplicates if the sender already added it optimismtically
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [channelId, fetchMessages]);

    const sendMessage = async (authorId: string, content: string) => {
        if (!channelId) return;
        try {
            await chatService.sendMessage(channelId, authorId, content);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        refresh: fetchMessages
    };
}
