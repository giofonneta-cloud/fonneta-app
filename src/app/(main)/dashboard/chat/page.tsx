'use client';

import { ChatMainView } from '@/features/chat/components/ChatMainView';

export default function ChatPage() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Comunicación</h1>
                    <p className="text-gray-500 font-medium mt-1">Colabora en tiempo real con tu equipo y proveedores.</p>
                </div>
            </div>

            <ChatMainView />
        </div>
    );
}
