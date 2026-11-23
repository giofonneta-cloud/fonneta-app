import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type AppRole = 'admin' | 'pm' | 'administrativo' | 'proveedor';

export const STAFF_ROLES: readonly AppRole[] = ['admin', 'pm', 'administrativo'];

export interface AuthContext {
  user: User;
  role: AppRole | null;
  isStaff: boolean;
}

export type GuardResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: NextResponse };

export function jsonError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Exige sesión válida. El rol se lee siempre de la BD (nunca del cliente). */
export async function requireUser(): Promise<GuardResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: jsonError(401, 'No autorizado') };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as AppRole | undefined) ?? null;
  return { ok: true, ctx: { user, role, isStaff: role !== null && STAFF_ROLES.includes(role) } };
}

/** Exige uno de los roles indicados (por defecto, personal interno). */
export async function requireRole(allowed: readonly AppRole[] = STAFF_ROLES): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.ok) return result;

  if (!result.ctx.role || !allowed.includes(result.ctx.role)) {
    return { ok: false, response: jsonError(403, 'No tienes permisos para esta acción') };
  }
  return result;
}

export function requireStaff(): Promise<GuardResult> {
  return requireRole(STAFF_ROLES);
}

export function requireAdmin(): Promise<GuardResult> {
  return requireRole(['admin']);
}

/** Compara el Bearer del cron de Vercel con CRON_SECRET en tiempo constante. */
export function hasValidCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Rate limit persistente (tabla api_rate_limits, compartida entre instancias).
 * Devuelve true si la petición está dentro del límite. Ante un fallo de la BD
 * deja pasar (fail-open) para no tumbar el servicio, pero lo registra.
 */
export async function withinRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error('[rate-limit] RPC error:', error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error('[rate-limit] unexpected error:', err instanceof Error ? err.message : 'unknown');
    return true;
  }
}

export function tooManyRequests(): NextResponse {
  return jsonError(429, 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.');
}
