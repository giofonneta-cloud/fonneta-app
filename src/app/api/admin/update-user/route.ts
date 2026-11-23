import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, requireAdmin } from '@/lib/auth/guard';

// Lista blanca de columnas editables: nunca se aceptan campos arbitrarios del cliente.
const updatesSchema = z
  .object({
    full_name: z.string().trim().max(150).nullable(),
    role: z.enum(['admin', 'pm', 'administrativo', 'proveedor']),
    phone: z.string().trim().max(30).nullable(),
    position: z.string().trim().max(100).nullable(),
    is_active: z.boolean(),
    approval_limit_expenses: z.number().nonnegative().nullable(),
    approval_limit_sales: z.number().nonnegative().nullable(),
    notification_email: z.boolean(),
    notification_platform: z.boolean(),
    notification_frequency: z.enum(['daily', 'weekly', 'monthly', 'never']),
    avatar_url: z.string().url().max(2048).nullable(),
  })
  .partial()
  .strict();

const bodySchema = z.object({
  userId: z.string().uuid(),
  updates: updatesSchema,
});

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, 'Datos inválidos');
  const { userId, updates } = parsed.data;

  // Un admin no puede quitarse a sí mismo el acceso (evita quedarse sin administradores)
  if (userId === auth.ctx.user.id && (updates.role && updates.role !== 'admin' || updates.is_active === false)) {
    return jsonError(400, 'No puedes quitarte el rol de administrador ni desactivarte a ti mismo');
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('[admin/update-user] error:', error.message);
    return jsonError(500, 'No se pudo actualizar el usuario');
  }

  return NextResponse.json({ success: true });
}
