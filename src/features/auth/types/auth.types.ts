export type UserRole = 'admin' | 'pm' | 'administrativo' | 'proveedor';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
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
