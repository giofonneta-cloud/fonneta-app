import { supabase } from '@/shared/lib/supabase';

export interface QuoteCostCenterAccess {
  id: string;
  user_id: string;
  cost_center: string;
  user_name?: string;
  user_email?: string;
}

export const quoteAccessService = {
  /**
   * Centros de costo habilitados para el usuario actual (usado por el formulario
   * para restringir el selector cuando no tiene quotes.view_all).
   */
  async getMyCostCenters(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('quote_cost_center_access')
      .select('cost_center')
      .eq('user_id', userId);

    if (error) throw error;
    return (data ?? []).map((r) => r.cost_center);
  },

  /**
   * Todos los accesos configurados, con nombre del usuario (solo visible para
   * quien tenga quotes.view_all — lo filtra la RLS de quote_cost_center_access).
   */
  async getAllAccess(): Promise<QuoteCostCenterAccess[]> {
    const { data, error } = await supabase
      .from('quote_cost_center_access')
      .select('id, user_id, cost_center, profiles:user_id (full_name, email)')
      .order('cost_center');

    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => {
      const profile = row.profiles as { full_name?: string; email?: string } | null;
      return {
        id: row.id as string,
        user_id: row.user_id as string,
        cost_center: row.cost_center as string,
        user_name: profile?.full_name,
        user_email: profile?.email,
      };
    });
  },

  async grantAccess(userId: string, costCenter: string): Promise<void> {
    const { error } = await supabase
      .from('quote_cost_center_access')
      .insert({ user_id: userId, cost_center: costCenter });

    if (error) throw error;
  },

  async revokeAccess(id: string): Promise<void> {
    const { error } = await supabase.from('quote_cost_center_access').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Usuarios que tienen algún permiso de cotizaciones asignado (para el selector
   * del panel de accesos, evita listar los cientos de usuarios sin relación).
   */
  async getQuoteUsers(): Promise<{ id: string; full_name: string; email: string }[]> {
    const { data, error } = await supabase
      .from('user_app_roles')
      .select('profiles:user_id (id, full_name, email), app_roles:role_id (permissions)');

    if (error) throw error;

    const seen = new Map<string, { id: string; full_name: string; email: string }>();
    for (const row of (data ?? []) as unknown as Array<{
      profiles: { id: string; full_name: string; email: string } | null;
      app_roles: { permissions: string[] } | null;
    }>) {
      const perms = row.app_roles?.permissions ?? [];
      if (!row.profiles || (!perms.includes('quotes.view') && !perms.includes('quotes.create'))) continue;
      seen.set(row.profiles.id, row.profiles);
    }
    return Array.from(seen.values());
  },
};
