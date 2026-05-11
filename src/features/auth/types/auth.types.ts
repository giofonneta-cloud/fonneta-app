import { Permission } from '@/shared/types/permissions';

export type UserRole = 'admin' | 'pm' | 'administrativo' | 'proveedor' | string;

export interface AppRoleData {
    id: string;
    name: string;
    permissions: Permission[];
    approval_limits: {
        expenses: number;
        sales: number;
    };
}

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    roles?: AppRoleData[];
    permissions?: Permission[];
    is_active: boolean;
    approval_limit_expenses: number | null;
    approval_limit_sales: number | null;
    notification_email: boolean;
    notification_platform: boolean;
    created_at: string;
    updated_at: string;
}

export interface AuthState {
    profile: Profile | null;
    isLoading: boolean;
    error: string | null;
}
