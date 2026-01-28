'use client';

import { Channel } from '../types/chat.types';
import { Hash, Lock, ChevronDown, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ChatSidebarProps {
    channels: Channel[];
    activeChannelId: string | null;
    onChannelSelect: (id: string) => void;
}

export function ChatSidebar({ channels, activeChannelId, onChannelSelect }: ChatSidebarProps) {
    const categories = ['PROYECTOS', 'CLIENTES', 'PROVEEDORES', 'GENERAL', 'FINANZAS'];

    return (
        <div className="w-60 h-[calc(100vh-100px)] bg-gray-50 flex flex-col rounded-l-3xl border-r border-gray-100">
            <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
                <h2 className="font-black text-gray-900 text-sm tracking-tight uppercase">Comunicación</h2>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-6 custom-scrollbar">
                {categories.map((category) => {
                    const categoryChannels = channels.filter(c => c.type.toUpperCase() === category || (c.type === 'proyecto' && category === 'PROYECTOS'));

                    if (categoryChannels.length === 0 && category !== 'GENERAL') return null;

                    return (
                        <div key={category} className="space-y-1">
                            <div className="flex items-center justify-between px-2 mb-1 group">
                                <span className="text-[10px] font-black text-gray-400 tracking-widest">{category}</span>
                                <Plus className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
                            </div>

                            {categoryChannels.map((channel) => (
                                <button
                                    key={channel.id}
                                    onClick={() => onChannelSelect(channel.id)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-bold transition-all",
                                        activeChannelId === channel.id
                                            ? "bg-gray-200 text-gray-900"
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                    )}
                                >
                                    {channel.is_private ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                    <span className="truncate">{channel.name}</span>
                                </button>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
