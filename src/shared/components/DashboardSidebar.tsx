'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSidebarStore } from '@/features/layout/store/sidebarStore';
import {
    BarChart3,
    FolderKanban,
    Users,
    CreditCard,
    MessageSquare,
    Settings,
    LogOut,
    LayoutDashboard,
    ShieldCheck,
    ClipboardList,
    ChevronLeft,
    ChevronRight
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
    const { isCollapsed, toggleSidebar } = useSidebarStore();

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
    const isAdministrativo = profile?.role === 'administrativo';

    return (
        <aside className={`h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Header con Logo y Toggle */}
            <div className={`flex items-center justify-between ${isCollapsed ? 'px-4 py-6' : 'px-8 py-6'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="Fonnetapp Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-black text-xl text-gray-900 tracking-tight">Fonnettapp</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden mx-auto">
                        <img src="/logo.png" alt="Fonnetapp Logo" className="w-full h-full object-contain" />
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                    title={isCollapsed ? 'Expandir' : 'Contraer'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <ChevronLeft className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-2 space-y-2 mt-4 overflow-y-auto">
                {!isCollapsed && (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
                        Menú Principal
                    </div>
                )}
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.label : ''}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && item.label}
                    </Link>
                ))}
                {(isAdmin || isAdministrativo) && (
                    <div className={`mt-4 pt-4 border-t border-gray-50 ${isCollapsed ? 'space-y-2' : ''}`}>
                        {!isCollapsed && (
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
                                Administración
                            </div>
                        )}
                        {isAdmin && (
                            <Link
                                href="/dashboard/admin"
                                className={`flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center' : ''}`}
                                title={isCollapsed ? 'Panel Admin' : ''}
                            >
                                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && 'Panel Admin'}
                            </Link>
                        )}
                        <Link
                            href="/dashboard/admin/parametros"
                            className={`flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? 'Parámetros' : ''}
                        >
                            <Settings className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && 'Parámetros'}
                        </Link>
                    </div>
                )}
            </nav>

            {/* Sección de Usuario */}
            <div className={`p-3 border-t border-gray-50 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                {profile && !isCollapsed && (
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
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${isAdmin ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {profile.role}
                        </span>
                    </div>
                )}

                {profile && isCollapsed && (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
                        ) : (
                            <span>{(profile.full_name || profile.email).charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                )}

                <Link
                    href="/dashboard/settings"
                    className={`flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center w-full' : ''}`}
                    title={isCollapsed ? 'Ajustes' : ''}
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && 'Ajustes'}
                </Link>
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center w-full' : 'w-full'}`}
                    title={isCollapsed ? 'Cerrar sesión' : ''}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && 'Cerrar sesión'}
                </button>
            </div>
        </aside>
    );
}
