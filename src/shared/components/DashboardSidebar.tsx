'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    BarChart3,
    FolderKanban,
    Users,
    CreditCard,
    MessageSquare,
    Settings,
    LogOut,
    LayoutDashboard,
    ShieldCheck
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Resumen', href: '/dashboard' },
    { icon: FolderKanban, label: 'Proyectos', href: '/dashboard/projects' },
    { icon: Users, label: 'Proveedores', href: '/dashboard/providers' },
    { icon: CreditCard, label: 'Finanzas', href: '/dashboard/finance' },
    { icon: MessageSquare, label: 'Comunicación', href: '/dashboard/chat' },
];

export function DashboardSidebar() {
    const router = useRouter();
    const { profile, signOut } = useAuthStore();

    const handleLogout = async () => {
        try {
            await signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            window.location.href = '/login';
        }
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0">
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" alt="Fonnetapp Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-black text-xl text-gray-900 tracking-tight">Fonnettapp</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
                    Menú Principal
                </div>
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-bold text-sm"
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </Link>
                ))}

                {isAdmin && (
                    <div className="mt-8 pt-4 border-t border-gray-50">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
                            Administración
                        </div>
                        <Link
                            href="/dashboard/admin"
                            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all font-bold text-sm"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            Panel Admin
                        </Link>
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-gray-50 space-y-2">
                {/* User Profile Section */}
                {profile && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
                            ) : (
                                <span>{(profile.full_name || profile.email).charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                                {profile.full_name || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-500 truncate lowercase">
                                {profile.email}
                            </p>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                            isAdmin ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                            {profile.role}
                        </span>
                    </div>
                )}

                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-bold text-sm"
                >
                    <Settings className="w-5 h-5" />
                    Ajustes
                </Link>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
