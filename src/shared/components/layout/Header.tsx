'use client';

import { NotificationBell } from '../connections/NotificationBell';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Menu } from 'lucide-react';

interface HeaderProps {
    title?: string;
    description?: string;
    onMenuClick?: () => void; // For mobile menu toggle if needed
}

export function Header({ title, description, onMenuClick }: HeaderProps) {
    const { profile } = useAuthStore();

    return (
        <header className="flex items-center justify-between mb-8">
            <div>
                {title && (
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        {title}
                    </h1>
                )}
                {description && (
                    <p className="text-gray-500 font-medium text-sm mt-1">
                        {description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />
                
                {/* User Info (Visible on Desktop) */}
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                            {profile?.full_name?.split(' ')[0] || 'Usuario'}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            {profile?.role}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
                        ) : (
                            <span>{(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
