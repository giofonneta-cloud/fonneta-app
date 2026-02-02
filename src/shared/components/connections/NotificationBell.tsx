'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { notificationService, Notification } from '@/shared/services/notificationService';
import { useAuthStore } from '@/features/auth/store/authStore';
import Link from 'next/link';

export function NotificationBell() {
    const { profile } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadNotifications = async () => {
        if (!profile?.id) return;
        try {
            const [notifs, count] = await Promise.all([
                notificationService.getNotifications(profile.id),
                notificationService.getUnreadCount(profile.id)
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Polling every 30 seconds for now (Realtime subscription can be added later)
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [profile?.id]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!profile?.id) return;
        try {
            await notificationService.markAllAsRead(profile.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                title="Notificaciones"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                Marcar todas leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">No tienes notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id} 
                                        className={`p-4 hover:bg-gray-50 transition-colors relative group ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                            <div className="flex-1 space-y-1">
                                                <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(notif.created_at).toLocaleString('es-CO', { 
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 text-blue-600 rounded-full transition-all self-start"
                                                    title="Marcar como leída"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <Link 
                            href="/notifications" 
                            className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Ver historial completo
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
