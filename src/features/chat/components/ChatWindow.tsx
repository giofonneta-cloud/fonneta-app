'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, Channel } from '../types/chat.types';
import { Send, Hash, User, Paperclip, Smile } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

interface ChatWindowProps {
    channel: Channel | null;
    messages: Message[];
    onSendMessage: (content: string) => void;
}

export function ChatWindow({ channel, messages, onSendMessage }: ChatWindowProps) {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { profile } = useAuthStore();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    if (!channel) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-r-3xl text-gray-400">
                <Hash className="w-16 h-16 opacity-10 mb-4" />
                <p className="font-bold">Selecciona un canal para comenzar</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white rounded-r-3xl overflow-hidden shadow-inner">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <h3 className="font-black text-gray-900">{channel.name}</h3>
                    {channel.description && (
                        <span className="text-gray-400 text-xs px-2 border-l border-gray-200 ml-2">{channel.description}</span>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((msg, index) => {
                    const isMe = msg.author_id === profile?.id;
                    const showAuthor = index === 0 || messages[index - 1].author_id !== msg.author_id;

                    return (
                        <div key={msg.id} className={clsx("flex gap-4", showAuthor ? "mt-4" : "mt-1")}>
                            {showAuthor ? (
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
                                    <User className="w-6 h-6 text-blue-500" />
                                </div>
                            ) : (
                                <div className="w-10 flex-shrink-0" />
                            )}

                            <div className="flex-1">
                                {showAuthor && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-black text-sm text-gray-900">{msg.author?.full_name || 'Usuario'}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}
                                <p className="text-sm text-gray-700 leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-6">
                <div className="bg-gray-100/80 rounded-2xl p-2 flex items-end gap-2 border border-gray-200/50 focus-within:bg-white focus-within:shadow-lg focus-within:border-blue-200 transition-all">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <textarea
                        className="flex-1 bg-transparent border-none outline-none p-2 text-sm font-medium resize-none max-h-32 custom-scrollbar"
                        placeholder={`Hablar en #${channel.name}`}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Smile className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function clsx(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
