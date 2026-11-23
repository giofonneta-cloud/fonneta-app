import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de salud para UptimeRobot / Better Stack. Público y sin datos sensibles:
 * solo indica si la app y la base de datos responden.
 */
export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();
  try {
    const { error } = await createAdminClient().from('system_config').select('id').limit(1);
    if (error) throw new Error(error.message);
    return NextResponse.json({ status: 'ok', db: 'ok', ms: Date.now() - startedAt });
  } catch (err) {
    console.error('[health] db check failed:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ status: 'degraded', db: 'down' }, { status: 503 });
  }
}
