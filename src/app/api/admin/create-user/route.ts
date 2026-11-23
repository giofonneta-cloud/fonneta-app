import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, requireAdmin } from '@/lib/auth/guard';
import { MIN_PASSWORD_LENGTH } from '@/lib/providers/registrationSchema';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(128),
  full_name: z.string().trim().min(2).max(150),
  role: z.enum(['admin', 'pm', 'administrativo', 'proveedor']),
  phone: z.string().trim().max(30).nullish(),
  position: z.string().trim().max(100).nullish(),
  approval_limit_expenses: z.number().nonnegative().nullish(),
  approval_limit_sales: z.number().nonnegative().nullish(),
  notification_email: z.boolean().optional(),
  notification_platform: z.boolean().optional(),
  notification_frequency: z.enum(['daily', 'weekly', 'monthly', 'never']).optional(),
});

/** Crea un usuario interno (solo administradores). Corre con service role en el servidor. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, `Datos inválidos. La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });

  if (createError || !created.user) {
    const exists = /already|registered|exists/i.test(createError?.message ?? '');
    return jsonError(exists ? 409 : 500, exists ? 'Ya existe un usuario con ese correo' : 'No se pudo crear el usuario');
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: created.user.id,
        email: input.email,
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
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (profileError) {
    console.error('[admin/create-user] profile error:', profileError.message);
    await admin.auth.admin.deleteUser(created.user.id);
    return jsonError(500, 'No se pudo crear el perfil del usuario');
  }

  return NextResponse.json({ success: true, profile });
}
