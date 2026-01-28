'use client';

import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/auth.types';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
    const { profile, isLoading } = useAuthStore();

    if (isLoading) return null;

    if (!profile || !allowedRoles.includes(profile.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
