import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDriveService } from '@/lib/google-drive/driveService';
import { jsonError, requireUser } from '@/lib/auth/guard';
import {
  EXTENSION_BY_MIME,
  MAX_DOCUMENT_BYTES,
  detectMime,
} from '@/lib/providers/registrationSchema';

export const maxDuration = 60;

const DOCUMENT_TYPES = ['RUT', 'Cedula_Rep_Legal', 'Camara_Comercio', 'Cert_Bancaria', 'Habeas_Data'];

/**
 * Sube un documento de proveedor a Drive. Solo personal interno o el dueño del proveedor.
 * El nombre, NIT y razón social se leen de la BD, nunca del formulario.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError(400, 'Solicitud inválida');

  const providerId = form.get('providerId');
  const documentType = form.get('documentType');
  const file = form.get('file');

  if (
    typeof providerId !== 'string' ||
    typeof documentType !== 'string' ||
    !DOCUMENT_TYPES.includes(documentType) ||
    !(file instanceof File) ||
    file.size === 0
  ) {
    return jsonError(400, 'Faltan parámetros requeridos');
  }
  if (file.size > MAX_DOCUMENT_BYTES) return jsonError(400, 'El archivo excede el tamaño máximo de 10MB');

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectMime(buffer);
  if (!mime) return jsonError(400, 'Solo se permiten archivos PDF, PNG o JPG');

  const admin = createAdminClient();
  const { data: provider } = await admin
    .from('providers')
    .select('business_name, document_number, user_id')
    .eq('id', providerId)
    .maybeSingle();

  if (!provider) return jsonError(404, 'Proveedor no encontrado');
  if (!auth.ctx.isStaff && provider.user_id !== auth.ctx.user.id) {
    return jsonError(403, 'No tienes permisos para este proveedor');
  }

  try {
    const drive = getDriveService();
    const folders = await drive.getOrCreateProviderFolders(
      providerId,
      provider.business_name ?? 'proveedor',
      provider.document_number ?? undefined
    );
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const result = await drive.uploadFile(
      buffer,
      `${documentType}_${stamp}.${EXTENSION_BY_MIME[mime]}`,
      mime,
      folders.documentsFolder
    );

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink,
    });
  } catch (err) {
    console.error('[providers/upload-document] error:', err instanceof Error ? err.message : 'unknown');
    return jsonError(500, 'No se pudo subir el documento');
  }
}
