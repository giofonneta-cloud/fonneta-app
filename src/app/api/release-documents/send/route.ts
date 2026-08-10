export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailService } from '@/lib/email/emailService';
import type { EmailAttachment } from '@/lib/email/emailService';
import { getDriveService } from '@/lib/google-drive/driveService';
import { createAdminClient } from '@/lib/supabase/admin';
import { TIPO_RELEASE_LABELS, type TipoRelease } from '@/features/finance/types/release-document.types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const handlerStart = Date.now();
  try {
    // 1. Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parsear body — siempre llega como FormData (PDF del cliente)
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Se requiere multipart/form-data con el PDF del release' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const releaseDocumentId = formData.get('releaseDocumentId') as string;
    const pdfFile = formData.get('pdfFile') as File | null;
    const rawCc = formData.get('ccEmail');
    const ccEmail =
      rawCc && typeof rawCc === 'string' && rawCc.trim() ? rawCc.trim() : undefined;

    if (!releaseDocumentId) {
      return NextResponse.json({ error: 'releaseDocumentId es requerido' }, { status: 400 });
    }

    if (!pdfFile || pdfFile.size === 0) {
      return NextResponse.json(
        { error: 'pdfFile es requerido (PDF generado en el cliente)' },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    // 3. Obtener release document con proveedor y OC asociada
    const { data: rd, error: rdError } = await supabase
      .from('release_documents')
      .select(`*, providers:provider_id (business_name, document_number), purchase_orders:purchase_order_id (po_number)`)
      .eq('id', releaseDocumentId)
      .single();

    if (rdError || !rd) {
      return NextResponse.json({ error: 'Documento de release no encontrado' }, { status: 404 });
    }

    // 4. Mutex atómico: reservar sent_at ANTES de enviar (previene doble-envío)
    const SEND_COOLDOWN_MS = 3000;
    const cooldownCutoff = new Date(Date.now() - SEND_COOLDOWN_MS).toISOString();
    const sentAtNow = new Date().toISOString();

    const adminClient = createAdminClient();
    const { count: lockCount, error: lockError } = await adminClient
      .from('release_documents')
      .update({ sent_at: sentAtNow, updated_at: sentAtNow }, { count: 'exact' })
      .eq('id', releaseDocumentId)
      .or(`sent_at.is.null,sent_at.lt.${cooldownCutoff}`);

    if (lockError || lockCount === null || lockCount === 0) {
      return NextResponse.json(
        { error: 'El release ya está siendo enviado o se envió recientemente. Espera 3 segundos.' },
        { status: 429 }
      );
    }

    const previousSentAt: string | null =
      rd.sent_at && rd.sent_at !== sentAtNow ? rd.sent_at : null;

    const releaseLock = async (reason: string) => {
      try {
        await adminClient
          .from('release_documents')
          .update({ sent_at: previousSentAt, updated_at: new Date().toISOString() })
          .eq('id', releaseDocumentId);
        console.warn('[send-release] Lock released', { releaseDocumentId, reason });
      } catch (releaseErr) {
        console.error('[send-release] Failed to release lock', releaseErr);
      }
    };

    const providerName = rd.providers?.business_name ?? rd.recipient_name;
    const pdfFilename = `${rd.release_number}.pdf`;
    const allAttachments: EmailAttachment[] = [
      { filename: pdfFilename, content: pdfBuffer, contentType: 'application/pdf' },
    ];

    // 5. Subir PDF a Google Drive (no bloqueante)
    let documentUrl: string | undefined;
    if (rd.provider_id) {
      try {
        const driveService = getDriveService();
        const folders = await driveService.getOrCreateProviderFolders(
          rd.provider_id,
          providerName,
          rd.providers?.document_number
        );
        const releasesFolder = await driveService.getOrCreateNamedFolder('Releases', folders.documentsFolder);
        const dateFolder = await driveService.getOrCreateDateFolder(releasesFolder);
        const result = await driveService.uploadFile(pdfBuffer, pdfFilename, 'application/pdf', dateFolder);
        documentUrl = result.webViewLink;
      } catch (driveErr) {
        console.error('[send-release] Drive upload failed (non-blocking)', {
          releaseDocumentId,
          error: driveErr,
        });
      }
    }

    // 6. Enviar email al proveedor con PDF adjunto (bloqueante)
    try {
      const emailService = getEmailService();
      const tipoLabel = TIPO_RELEASE_LABELS[rd.tipo_release as TipoRelease];
      await emailService.sendReleaseDocument(
        rd.recipient_email,
        rd.recipient_name,
        rd.release_number,
        tipoLabel,
        documentUrl,
        allAttachments,
        ccEmail
      );
    } catch (emailErr: unknown) {
      const errMsg = emailErr instanceof Error ? emailErr.message : 'desconocido';
      await releaseLock(`emailService.sendReleaseDocument: ${errMsg}`);
      console.error('[send-release] Email send failed', { releaseDocumentId, error: emailErr });
      return NextResponse.json({ error: `Error al enviar el correo: ${errMsg}` }, { status: 500 });
    }

    // 7. Guardar document_url (sent_at ya fue establecido en el paso 4)
    const { error: updateError } = await adminClient
      .from('release_documents')
      .update({
        ...(documentUrl ? { document_url: documentUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', releaseDocumentId);

    if (updateError) {
      console.error('[send-release] Error updating release status', { releaseDocumentId, error: updateError });
      return NextResponse.json(
        { error: 'Error al actualizar el estado del release' },
        { status: 500 }
      );
    }

    console.log('[send-release] Complete', {
      releaseDocumentId,
      totalMs: Date.now() - handlerStart,
    });

    return NextResponse.json({ success: true, documentUrl, releaseNumber: rd.release_number });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[send-release] Unhandled error', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
