export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDriveService } from '@/lib/google-drive/driveService';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Archiva el PDF de un Release en Google Drive y lo marca como enviado.
 * NO envía correo: el Release viaja adjunto al correo de la Orden de Compra.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Autenticar
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parsear FormData
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Se requiere multipart/form-data con el PDF del release' }, { status: 400 });
    }
    const formData = await request.formData();
    const releaseDocumentId = formData.get('releaseDocumentId') as string;
    const pdfFile = formData.get('pdfFile') as File | null;

    if (!releaseDocumentId) {
      return NextResponse.json({ error: 'releaseDocumentId es requerido' }, { status: 400 });
    }
    if (!pdfFile || pdfFile.size === 0) {
      return NextResponse.json({ error: 'pdfFile es requerido' }, { status: 400 });
    }
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    // 3. Obtener release + proveedor
    const { data: rd, error: rdError } = await supabase
      .from('release_documents')
      .select('release_number, provider_id, providers:provider_id (business_name, document_number)')
      .eq('id', releaseDocumentId)
      .single();

    if (rdError || !rd) {
      return NextResponse.json({ error: 'Documento de release no encontrado' }, { status: 404 });
    }

    const pdfFilename = `${rd.release_number}.pdf`;
    const providerInfo = rd.providers as unknown as { business_name: string; document_number: string | null } | null;

    // 4. Subir a Google Drive (no bloqueante)
    let documentUrl: string | undefined;
    if (rd.provider_id && providerInfo) {
      try {
        const driveService = getDriveService();
        const folders = await driveService.getOrCreateProviderFolders(
          rd.provider_id,
          providerInfo.business_name,
          providerInfo.document_number ?? undefined
        );
        const releasesFolder = await driveService.getOrCreateNamedFolder('Releases', folders.documentsFolder);
        const dateFolder = await driveService.getOrCreateDateFolder(releasesFolder);
        const result = await driveService.uploadFile(pdfBuffer, pdfFilename, 'application/pdf', dateFolder);
        documentUrl = result.webViewLink;
      } catch (driveErr) {
        console.error('[archive-release] Drive upload failed (non-blocking)', { releaseDocumentId, error: driveErr });
      }
    }

    // 5. Marcar document_url + sent_at
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from('release_documents')
      .update({
        ...(documentUrl ? { document_url: documentUrl } : {}),
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', releaseDocumentId);

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el release' }, { status: 500 });
    }

    return NextResponse.json({ success: true, documentUrl, releaseNumber: rd.release_number });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[archive-release] Unhandled error', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
