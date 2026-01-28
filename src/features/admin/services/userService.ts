// Servicio de gestión de usuarios

import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/features/auth/types/auth.types';
import { logAuditAction } from './adminService';

const supabase = createClient();

export interface ExtendedProfile extends Profile {
    phone: string | null;
    position: string | null;
    is_active: boolean;
    last_login: string | null;
    approval_limit_expenses: number | null;
    approval_limit_sales: number | null;
    notification_email: boolean;
    notification_platform: boolean;
    notification_frequency: string;
}

export interface CreateUserInput {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    position?: string;
    approval_limit_expenses?: number;
    approval_limit_sales?: number;
    notification_email?: boolean;
    notification_platform?: boolean;
    notification_frequency?: string;
}

export interface UpdateUserInput {
    full_name?: string;
    role?: UserRole;
    phone?: string;
    position?: string;
    is_active?: boolean;
    approval_limit_expenses?: number;
    approval_limit_sales?: number;
    notification_email?: boolean;
    notification_platform?: boolean;
    notification_frequency?: string;
}

export interface UserListParams {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UserListResult {
    users: ExtendedProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// =========================================
// LISTAR USUARIOS
// =========================================

export async function getUsers(params: UserListParams = {}): Promise<UserListResult> {
    const {
        search,
        role,
        isActive,
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = params;

    let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

    // Filtros
    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
        query = query.eq('role', role);
    }
    if (typeof isActive === 'boolean') {
        query = query.eq('is_active', isActive);
    }

    // Ordenamiento
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching users:', error);
        return {
            users: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
        };
    }

    return {
        users: (data ?? []) as ExtendedProfile[],
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
    };
}

// =========================================
// OBTENER USUARIO POR ID
// =========================================

export async function getUserById(userId: string): Promise<ExtendedProfile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return null;
    }

    return data as ExtendedProfile;
}

// =========================================
// CREAR USUARIO
// =========================================

export async function createUser(
    input: CreateUserInput
): Promise<{ success: boolean; data?: ExtendedProfile; error?: string }> {
    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true, // Auto-confirmar email
    });

    if (authError) {
        return { success: false, error: authError.message };
    }

    if (!authData.user) {
        return { success: false, error: 'No se pudo crear el usuario' };
    }

    // Actualizar profile con datos adicionales
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: input.full_name,
            role: input.role,
            phone: input.phone ?? null,
            position: input.position ?? null,
            approval_limit_expenses: input.approval_limit_expenses ?? null,
            approval_limit_sales: input.approval_limit_sales ?? null,
            notification_email: input.notification_email ?? true,
            notification_platform: input.notification_platform ?? true,
            notification_frequency: input.notification_frequency ?? 'weekly',
            is_active: true,
        })
        .eq('id', authData.user.id)
        .select()
        .single();

    if (profileError) {
        return { success: false, error: profileError.message };
    }

    // Registrar en auditoría
    await logAuditAction({
        action: 'user_created',
        entityType: 'user',
        entityId: authData.user.id,
        entityName: input.full_name,
        changes: { email: input.email, role: input.role },
    });

    return { success: true, data: profile as ExtendedProfile };
}

// =========================================
// ACTUALIZAR USUARIO
// =========================================

export async function updateUser(
    userId: string,
    input: UpdateUserInput
): Promise<{ success: boolean; error?: string }> {
    // Obtener estado anterior para auditoría
    const previousUser = await getUserById(userId);

    const { error } = await supabase
        .from('profiles')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        return { success: false, error: error.message };
    }

    // Registrar en auditoría
    await logAuditAction({
        action: 'user_updated',
        entityType: 'user',
        entityId: userId,
        entityName: previousUser?.full_name ?? 'Unknown',
        changes: {
            before: {
                role: previousUser?.role,
                is_active: previousUser?.is_active,
            },
            after: input,
        },
    });

    return { success: true };
}

// =========================================
// BLOQUEAR/DESBLOQUEAR USUARIO
// =========================================

export async function toggleUserActive(
    userId: string,
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    const user = await getUserById(userId);

    const { error } = await supabase
        .from('profiles')
        .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        return { success: false, error: error.message };
    }

    // Registrar en auditoría
    await logAuditAction({
        action: isActive ? 'user_unblocked' : 'user_blocked',
        entityType: 'user',
        entityId: userId,
        entityName: user?.full_name ?? 'Unknown',
    });

    return { success: true };
}

// =========================================
// RESTABLECER CONTRASEÑA
// =========================================

export async function resetUserPassword(
    userId: string
): Promise<{ success: boolean; error?: string }> {
    const user = await getUserById(userId);

    if (!user?.email) {
        return { success: false, error: 'Usuario no encontrado' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Registrar en auditoría
    await logAuditAction({
        action: 'password_reset_sent',
        entityType: 'user',
        entityId: userId,
        entityName: user.full_name ?? 'Unknown',
    });

    return { success: true };
}

// =========================================
// ESTADÍSTICAS DE USUARIOS
// =========================================

export interface UserStats {
    total: number;
    byRole: Record<UserRole, number>;
    active: number;
    inactive: number;
    newThisMonth: number;
}

export async function getUserStats(): Promise<UserStats> {
    const { data: profiles } = await supabase
        .from('profiles')
        .select('role, is_active, created_at');

    if (!profiles) {
        return {
            total: 0,
            byRole: { admin: 0, pm: 0, administrativo: 0, proveedor: 0 },
            active: 0,
            inactive: 0,
            newThisMonth: 0,
        };
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: UserStats = {
        total: profiles.length,
        byRole: { admin: 0, pm: 0, administrativo: 0, proveedor: 0 },
        active: 0,
        inactive: 0,
        newThisMonth: 0,
    };

    for (const profile of profiles) {
        // Por rol
        if (profile.role && profile.role in stats.byRole) {
            stats.byRole[profile.role as UserRole]++;
        }

        // Activos/Inactivos
        if (profile.is_active !== false) {
            stats.active++;
        } else {
            stats.inactive++;
        }

        // Nuevos este mes
        if (new Date(profile.created_at) >= firstDayOfMonth) {
            stats.newThisMonth++;
        }
    }

    return stats;
}
