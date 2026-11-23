import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDriveService } from '@/lib/google-drive/driveService';
import { jsonError, requireUser, type AuthContext } from '@/lib/auth/guard';
import { parseDocumentUrl, type DocumentTarget } from '@/lib/documents/documentUrl';
import { userOwnsDriveFile, userOwnsStoragePath } from '@/lib/documents/ownership';

const MAX_SERVED_BYTES = 25 * 1024 * 1024;
const INLINE_MIMES = ['application/pdf', 'image/png', 'image/jpeg'];

/** Columnas donde la app guarda URLs de documentos. RLS filtra por usuario. */
const DOCUMENT_COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ['providers', 'rut_url'],
  ['providers', 'cedula_url'],
  ['providers', 'camara_comercio_url'],
  ['providers', 'cert_bancaria_url'],
  ['provider_documents', 'archivo_url'],
  ['provider_invoices', 'document_url'],
  ['provider_invoices', 'orden_compra_url'],
  ['provider_invoices', 'seguridad_social_url'],
  ['provider_invoices', 'release_url'],
  ['purchase_orders', 'document_url'],
  ['release_documents', 'document_url'],
  ['legalizacion_items', 'soporte_url'],
];

/** Filtro previo y barato: la URL aparece en una fila que la sesión del usuario puede leer (RLS). */
async function urlAppearsInOwnRows(url: string): Promise<boolean> {
  const supabase = await createClient();
  const checks = await Promise.all(
    DOCUMENT_COLUMNS.map(async ([table, column]) => {
      const { data, error } = await supabase.from(table).select('id').eq(column, url).limit(1);
      return !error && (data?.length ?? 0) > 0;
    })
  );
  return checks.some(Boolean);
}

/**
 * Autorización por UBICACIÓN REAL del archivo, no por lo que diga una URL guardada
 * (una URL en una fila que el usuario puede escribir no prueba que el archivo sea suyo):
 *  - Drive: debe colgar de la raíz de la app; un no-staff además debe estar en SU carpeta.
 *  - Storage: un no-staff solo accede a rutas `documents/<su-id | id-de-su-proveedor>/...`.
 */
async function canServe(ctx: AuthContext, target: DocumentTarget, rawUrl: string): Promise<boolean> {
  if (target.kind === 'drive') {
    const ancestry = await getDriveService().getAncestry(target.fileId);
    if (!ancestry.insideRoot) return false;
    if (ctx.isStaff) return true;

    if (!(await urlAppearsInOwnRows(rawUrl))) return false;
    const supabase = await createClient();
    const { data: providers } = await supabase
      .from('providers')
      .select('document_number')
      .eq('user_id', ctx.user.id);

    return userOwnsDriveFile(ancestry.names, {
      userId: ctx.user.id,
      providerDocumentNumbers: (providers ?? []).map((p) => String(p.document_number ?? '')).filter(Boolean),
    });
  }

  if (target.bucket !== 'providers') return false;
  if (ctx.isStaff) return true;

  if (!(await urlAppearsInOwnRows(rawUrl))) return false;
  const supabase = await createClient();
  const { data: providers } = await supabase.from('providers').select('id').eq('user_id', ctx.user.id);
  return userOwnsStoragePath(target.path, [ctx.user.id, ...(providers ?? []).map((p) => String(p.id))]);
}

function safeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'documento';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const rawUrl = request.nextUrl.searchParams.get('u');
  if (!rawUrl || rawUrl.length > 2048) return jsonError(400, 'Documento inválido');

  const target = parseDocumentUrl(rawUrl, process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!target) return jsonError(400, 'Documento inválido');

  try {
    if (!(await canServe(auth.ctx, target, rawUrl))) {
      return jsonError(403, 'No tienes acceso a este documento');
    }

    if (target.kind === 'storage') {
      const admin = createAdminClient();
      const { data, error } = await admin.storage.from(target.bucket).createSignedUrl(target.path, 60);
      if (error || !data?.signedUrl) return jsonError(404, 'Documento no encontrado');
      return NextResponse.redirect(data.signedUrl, 302);
    }

    const drive = getDriveService();
    const meta = await drive.getFileMeta(target.fileId);
    if (meta.size > MAX_SERVED_BYTES) return jsonError(413, 'El documento es demasiado grande');

    const body = await drive.downloadFile(target.fileId);
    const inline = INLINE_MIMES.includes(meta.mimeType);

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': inline ? meta.mimeType : 'application/octet-stream',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeFileName(meta.name)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[documents/view] error:', err instanceof Error ? err.message : 'unknown');
    return jsonError(404, 'Documento no encontrado');
  }
}
