import { Permission } from '@/shared/types/permissions';

export interface AppRole {
    id: string;
    name: string;
    description: string | null;
    permissions: Permission[];
    approval_limits: {
        expenses: number;
        sales: number;
    };
    is_system_role: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserAppRole {
    user_id: string;
    role_id: string;
    role?: AppRole;
}

export interface RoleWithMemberCount extends AppRole {
    _count?: {
        users: number;
    };
}
