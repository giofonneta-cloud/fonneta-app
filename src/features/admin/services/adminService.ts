// Servicio de administración - Estadísticas y configuración del sistema

import { createClient } from '@/lib/supabase/client';
import type {
    SystemStats,
    FinancialSummary,
    AdoptionMetrics,
    AdminAlert,
    SystemConfig,
    CustomField,
    AuditLog
} from '../types/admin.types';

const supabase = createClient();

// =========================================
// ESTADÍSTICAS DEL SISTEMA
// =========================================

export async function getSystemStats(): Promise<SystemStats> {
    // Total de usuarios
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Usuarios activos (con login en últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    // Total de proyectos
    const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

    // Proyectos activos (no completados ni cancelados)
    const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("completed","cancelled")');

    // Total de proveedores
    const { count: totalProviders } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true });

    // Proveedores activos
    const { count: activeProviders } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'aprobado');

    // Facturas pendientes de validar
    const { count: pendingInvoices } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('factura_validada', false);

    // Documentos próximos a vencer (30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { count: expiringDocuments } = await supabase
        .from('provider_documents')
        .select('*', { count: 'exact', head: true })
        .lte('fecha_vencimiento', thirtyDaysFromNow.toISOString())
        .gte('fecha_vencimiento', new Date().toISOString());

    // Usuarios inactivos (sin login en 30 días)
    const { count: inactiveUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`last_login.is.null,last_login.lt.${thirtyDaysAgo.toISOString()}`);

    return {
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        totalProjects: totalProjects ?? 0,
        activeProjects: activeProjects ?? 0,
        totalProviders: totalProviders ?? 0,
        activeProviders: activeProviders ?? 0,
        pendingInvoices: pendingInvoices ?? 0,
        expiringDocuments: expiringDocuments ?? 0,
        inactiveUsersCount: inactiveUsersCount ?? 0,
    };
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ventas del mes actual
    const { data: monthSales } = await supabase
        .from('ventas')
        .select('valor_neto')
        .gte('fecha_venta', firstDayOfMonth.toISOString());

    const monthlyRevenue = monthSales?.reduce((sum, s) => sum + (Number(s.valor_neto) || 0), 0) ?? 0;

    // Gastos del mes actual
    const { data: monthExpenses } = await supabase
        .from('expenses')
        .select('total_con_iva')
        .gte('fecha', firstDayOfMonth.toISOString());

    const monthlyExpenses = monthExpenses?.reduce((sum, e) => sum + (Number(e.total_con_iva) || 0), 0) ?? 0;

    // Margen promedio
    const averageMargin = monthlyRevenue > 0
        ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100
        : 0;

    // Cuentas por pagar pendientes
    const { data: payables } = await supabase
        .from('expenses')
        .select('total_con_iva')
        .eq('estado', 'pendiente');

    const pendingPayables = payables?.reduce((sum, e) => sum + (Number(e.total_con_iva) || 0), 0) ?? 0;

    // Cuentas por cobrar pendientes
    const { data: receivables } = await supabase
        .from('ventas')
        .select('valor_neto')
        .eq('estado_pago', 'pendiente');

    const pendingReceivables = receivables?.reduce((sum, s) => sum + (Number(s.valor_neto) || 0), 0) ?? 0;

    // Proyectos pendientes de facturar
    const { count: projectsToInvoice } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .eq('invoiced', false);

    return {
        monthlyRevenue,
        monthlyExpenses,
        averageMargin: Math.round(averageMargin * 100) / 100,
        pendingPayables,
        pendingReceivables,
        projectsToInvoice: projectsToInvoice ?? 0,
    };
}

export async function getAdoptionMetrics(): Promise<AdoptionMetrics> {
    // Proyectos registrados vs objetivo
    const { count: projectsInSystem } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

    // Proveedores usando portal
    const { count: providersUsingPortal } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .not('user_id', 'is', null);

    const { count: providersTotal } = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true });

    // Gastos auto-registrados (con factura_url = OCR)
    const { count: autoRegisteredExpenses } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .not('factura_url', 'is', null);

    const { count: totalExpenses } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true });

    return {
        projectsInSystem: projectsInSystem ?? 0,
        projectsTarget: 100, // Objetivo configurable
        providersUsingPortal: providersUsingPortal ?? 0,
        providersTotal: providersTotal ?? 0,
        autoRegisteredExpenses: autoRegisteredExpenses ?? 0,
        totalExpenses: totalExpenses ?? 0,
        avgInvoiceApprovalDays: 3, // TODO: Calcular real
    };
}

export async function getAdminAlerts(): Promise<AdminAlert[]> {
    const alerts: AdminAlert[] = [];
    const now = new Date();

    // Documentos próximos a vencer
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { count: expiringDocs } = await supabase
        .from('provider_documents')
        .select('*', { count: 'exact', head: true })
        .lte('fecha_vencimiento', thirtyDaysFromNow.toISOString())
        .gte('fecha_vencimiento', now.toISOString());

    if (expiringDocs && expiringDocs > 0) {
        alerts.push({
            id: 'expiring-docs',
            type: 'warning',
            title: 'Documentos por vencer',
            description: `${expiringDocs} documentos vencen en los próximos 30 días`,
            link: '/dashboard/providers?filter=expiring',
            count: expiringDocs,
            createdAt: now.toISOString(),
        });
    }

    // Facturas pendientes de validar
    const { count: pendingInvoices } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('factura_validada', false);

    if (pendingInvoices && pendingInvoices > 0) {
        alerts.push({
            id: 'pending-invoices',
            type: 'info',
            title: 'Facturas pendientes',
            description: `${pendingInvoices} facturas esperan validación`,
            link: '/dashboard/finance?filter=pending',
            count: pendingInvoices,
            createdAt: now.toISOString(),
        });
    }

    // Usuarios inactivos
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: inactiveUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`last_login.is.null,last_login.lt.${thirtyDaysAgo.toISOString()}`);

    if (inactiveUsers && inactiveUsers > 0) {
        alerts.push({
            id: 'inactive-users',
            type: 'warning',
            title: 'Usuarios inactivos',
            description: `${inactiveUsers} usuarios no han ingresado en 30+ días`,
            link: '/dashboard/admin/users?filter=inactive',
            count: inactiveUsers,
            createdAt: now.toISOString(),
        });
    }

    return alerts;
}

// =========================================
// CONFIGURACIÓN DEL SISTEMA
// =========================================

export async function getSystemModules(): Promise<SystemConfig[]> {
    const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('module_name');

    if (error) {
        console.error('Error fetching system modules:', error);
        return [];
    }

    return data ?? [];
}

export async function toggleModule(
    moduleId: string,
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('system_config')
        .update({
            is_active: isActive,
            updated_at: new Date().toISOString()
        })
        .eq('id', moduleId)
        .eq('is_core', false); // No permitir cambiar módulos core

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function updateModuleConfig(
    moduleId: string,
    configData: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('system_config')
        .update({
            config_data: configData,
            updated_at: new Date().toISOString()
        })
        .eq('id', moduleId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// =========================================
// CAMPOS PERSONALIZADOS
// =========================================

export async function getCustomFields(
    entityType?: string
): Promise<CustomField[]> {
    let query = supabase
        .from('custom_fields')
        .select('*')
        .order('display_order');

    if (entityType) {
        query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching custom fields:', error);
        return [];
    }

    return data ?? [];
}

export async function createCustomField(
    field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: CustomField; error?: string }> {
    const { data, error } = await supabase
        .from('custom_fields')
        .insert(field)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function updateCustomField(
    fieldId: string,
    updates: Partial<CustomField>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('custom_fields')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', fieldId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function deleteCustomField(
    fieldId: string
): Promise<{ success: boolean; error?: string }> {
    // Soft delete - solo desactivar
    const { error } = await supabase
        .from('custom_fields')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', fieldId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// =========================================
// LOGS DE AUDITORÍA
// =========================================

export async function getAuditLogs(params?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<AuditLog[]> {
    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(params?.limit ?? 100);

    if (params?.userId) {
        query = query.eq('user_id', params.userId);
    }
    if (params?.action) {
        query = query.eq('action', params.action);
    }
    if (params?.entityType) {
        query = query.eq('entity_type', params.entityType);
    }
    if (params?.startDate) {
        query = query.gte('created_at', params.startDate);
    }
    if (params?.endDate) {
        query = query.lte('created_at', params.endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }

    return data ?? [];
}

export async function logAuditAction(params: {
    action: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    changes?: Record<string, unknown>;
}): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', user.id)
        .single();

    await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: profile?.email,
        user_role: profile?.role,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        changes: params.changes,
    });
}
