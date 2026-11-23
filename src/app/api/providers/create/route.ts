import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, requireUser } from '@/lib/auth/guard';
import { getDriveService } from '@/lib/google-drive/driveService';
import { parseDocumentUrl } from '@/lib/documents/documentUrl';
import { userOwnsDriveFile } from '@/lib/documents/ownership';
import { syncProviderDocuments } from '@/lib/providers/syncProviderDocuments';

const urlField = z.string().trim().url().max(2048).nullable().optional();

const patchSchema = z.object({
  providerId: z.string().uuid(),
  rut_url: urlField,
  cedula_url: urlField,
  camara_comercio_url: urlField,
  cert_bancaria_url: urlField,
});

/**
 * Actualiza las URLs de documentos de un proveedor.
 * Autorizado para personal interno o para el propio dueño del registro.
 * (La creación de proveedores nuevos vive en /api/providers/register.)
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, 'Datos inválidos');
  const { providerId, ...urls } = parsed.data;

  const admin = createAdminClient();

  if (!auth.ctx.isStaff) {
    const { data: owned } = await admin
      .from('providers')
      .select('id, document_number')
      .eq('id', providerId)
      .eq('user_id', auth.ctx.user.id)
      .maybeSingle();
    if (!owned) return jsonError(403, 'No tienes permisos para modificar este proveedor');

    // Un proveedor solo puede enlazar archivos que YA están en su propia carpeta de Drive
    // (subidos por el servidor). Impide apuntar la fila a documentos de otros proveedores.
    const submitted = Object.values(urls).filter((value): value is string => Boolean(value));
    if (submitted.length > 0) {
      const drive = getDriveService();
      for (const url of submitted) {
        const target = parseDocumentUrl(url);
        if (!target || target.kind !== 'drive') return jsonError(400, 'Documento inválido');
        const ancestry = await drive.getAncestry(target.fileId);
        const mine = ancestry.insideRoot && userOwnsDriveFile(ancestry.names, {
          userId: auth.ctx.user.id,
          providerDocumentNumbers: [String(owned.document_number ?? '')].filter(Boolean),
        });
        if (!mine) return jsonError(403, 'El documento no pertenece a tu carpeta');
      }
    }
  }

  const { error } = await admin
    .from('providers')
    .update({
      ...(urls.rut_url !== undefined && { rut_url: urls.rut_url }),
      ...(urls.cedula_url !== undefined && { cedula_url: urls.cedula_url }),
      ...(urls.camara_comercio_url !== undefined && { camara_comercio_url: urls.camara_comercio_url }),
      ...(urls.cert_bancaria_url !== undefined && { cert_bancaria_url: urls.cert_bancaria_url }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', providerId);

  if (error) {
    console.error('[providers/create] update error:', error.message);
    return jsonError(400, 'No se pudo actualizar el proveedor');
  }

  await syncProviderDocuments(admin, providerId, urls);
  return NextResponse.json({ success: true });
}
