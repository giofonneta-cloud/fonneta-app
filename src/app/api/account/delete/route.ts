import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDriveService } from '@/lib/google-drive/driveService';
import { jsonError, requireUser, tooManyRequests, withinRateLimit } from '@/lib/auth/guard';

const bodySchema = z.object({ password: z.string().min(1).max(128) });

/** Comprueba la contraseña con un cliente efímero (no toca la sesión del navegador). */
async function passwordIsValid(email: string, password: string): Promise<boolean> {
  const client = createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { error } = await client.auth.signInWithPassword({ email, password });
  return !error;
}

/**
 * Derecho de supresión (Habeas Data): el proveedor elimina su cuenta y sus datos personales.
 * Los registros contables (facturas, órdenes) se CONSERVAN anonimizados por obligación de
 * conservación contable; documentos de identidad, perfil y acceso se eliminan.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (auth.ctx.role !== 'proveedor') {
    return jsonError(403, 'Las cuentas internas las elimina un administrador desde el panel de usuarios.');
  }
  if (!(await withinRateLimit(`delete-account:${auth.ctx.user.id}`, 5, 3600))) return tooManyRequests();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, 'Ingresa tu contraseña para confirmar');

  const email = auth.ctx.user.email;
  if (!email || !(await passwordIsValid(email, parsed.data.password))) {
    return jsonError(400, 'La contraseña es incorrecta');
  }

  const userId = auth.ctx.user.id;
  const admin = createAdminClient();

  try {
    const { data: provider } = await admin
      .from('providers')
      .select('id, business_name, document_number')
      .eq('user_id', userId)
      .maybeSingle();

    if (provider) {
      // 1. Documentos de identidad en Drive (best-effort: no bloquea la supresión)
      try {
        await getDriveService().trashProviderFolder(provider.business_name, provider.document_number ?? undefined);
      } catch (driveErr) {
        console.error('[account/delete] drive cleanup failed:', driveErr instanceof Error ? driveErr.message : 'unknown');
      }

      // 2. Documentos relacionales y anonimización del proveedor
      await admin.from('provider_documents').delete().eq('provider_id', provider.id);
      const tag = provider.id.slice(0, 8);
      const { error: anonError } = await admin
        .from('providers')
        .update({
          business_name: `Proveedor eliminado ${tag}`,
          document_number: `ELIMINADO-${tag}`,
          contact_name: null,
          contact_email: null,
          contact_phone: null,
          billing_email: null,
          address: null,
          city: null,
          department: null,
          rut_url: null,
          cedula_url: null,
          camara_comercio_url: null,
          cert_bancaria_url: null,
          user_id: null,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', provider.id);
      if (anonError) throw new Error(`anonymize: ${anonError.message}`);
    }

    // 3. Acceso: eliminar el usuario de Auth (cascada a perfil y notificaciones).
    //    Si hay registros que lo referencian sin cascada, se bloquea y se anonimiza.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      await admin.auth.admin.updateUserById(userId, {
        email: `eliminado-${userId}@invalid.local`,
        ban_duration: '876000h',
      });
      await admin
        .from('profiles')
        .update({ email: `eliminado-${userId}@invalid.local`, full_name: 'Usuario eliminado', phone: null, is_active: false })
        .eq('id', userId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[account/delete] failed:', err instanceof Error ? err.message : 'unknown');
    return jsonError(500, 'No se pudo completar la eliminación. Contacta a administrativo@fonneta.com.');
  }
}
