export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authPermissionService } from '@/features/auth/services/authPermissionService';
import { getEmailService } from '@/lib/email/emailService';
import type { EmailAttachment } from '@/lib/email/emailService';
import { getDriveService } from '@/lib/google-drive/driveService';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // 2. Verificar permiso de creación/envío de cotizaciones
    const canSend = await authPermissionService.hasPermission(user.id, 'quotes.create');
    if (!canSend) {
      return NextResponse.json({ error: 'No tienes permiso para enviar cotizaciones' }, { status: 403 });
    }

    // 3. Parsear body — siempre llega como FormData (PDF del cliente + adjuntos opcionales)
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Se requiere multipart/form-data con el PDF de la cotización' }, { status: 400 });
    }

    const formData = await request.formData();
    const quoteId = formData.get('quoteId') as string;
    const pdfFile = formData.get('pdfFile') as File | null;
    const rawCc = formData.get('ccEmail');
    const ccEmail = rawCc && typeof rawCc === 'string' && rawCc.trim() ? rawCc.trim() : undefined;

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId es requerido' }, { status: 400 });
    }

    if (!pdfFile || pdfFile.size === 0) {
      return NextResponse.json({ error: 'pdfFile es requerido (PDF generado en el cliente)' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    const emailAttachments: EmailAttachment[] = [];
    const files = formData.getAll('attachments') as File[];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      emailAttachments.push({ filename: file.name, content: buffer, contentType: file.type });
    }

    // 4. Obtener cotización
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // 5. Validar estado
    const allowedStatuses = ['borrador', 'enviada'];
    if (!allowedStatuses.includes(quote.status)) {
      return NextResponse.json({ error: `No se puede enviar la cotización (estado: ${quote.status})` }, { status: 409 });
    }

    // 6. Mutex atómico: reservar sent_at ANTES de enviar (previene doble-envío)
    const SEND_COOLDOWN_MS = 3000;
    const cooldownCutoff = new Date(Date.now() - SEND_COOLDOWN_MS).toISOString();
    const sentAtNow = new Date().toISOString();

    const adminClient = createAdminClient();
    const { count: lockCount, error: lockError } = await adminClient
      .from('quotes')
      .update({ sent_at: sentAtNow, updated_at: sentAtNow }, { count: 'exact' })
      .eq('id', quoteId)
      .in('status', allowedStatuses)
      .or(`sent_at.is.null,sent_at.lt.${cooldownCutoff}`);

    if (lockError || lockCount === null || lockCount === 0) {
      return NextResponse.json(
        { error: 'La cotización ya está siendo enviada o se envió recientemente. Espera 3 segundos.' },
        { status: 429 }
      );
    }

    const previousSentAt: string | null = quote.sent_at && quote.sent_at !== sentAtNow ? quote.sent_at : null;

    const releaseLock = async (reason: string) => {
      try {
        await adminClient
          .from('quotes')
          .update({ sent_at: previousSentAt, updated_at: new Date().toISOString() })
          .eq('id', quoteId);
        console.warn('[send-quote] Lock released', { quoteId, reason });
      } catch (releaseErr) {
        console.error('[send-quote] Failed to release lock', releaseErr);
      }
    };

    const pdfFilename = `Cotizacion_${quote.quote_number}.pdf`;

    // 7. Preparar adjuntos: PDF primero + adjuntos del usuario (sin duplicados)
    const allAttachments: EmailAttachment[] = [
      { filename: pdfFilename, content: pdfBuffer, contentType: 'application/pdf' },
      ...emailAttachments.filter((a) => a.filename !== pdfFilename),
    ];

    // 8. Subir PDF a Google Drive (no bloqueante, solo si hay cliente registrado)
    let documentUrl: string | undefined;
    if (quote.client_id) {
      try {
        const driveService = getDriveService();
        const folders = await driveService.getOrCreateProviderFolders(quote.client_id, quote.client_name);
        const result = await driveService.uploadFile(pdfBuffer, pdfFilename, 'application/pdf', folders.documentsFolder);
        documentUrl = result.webViewLink;
      } catch (driveErr) {
        console.error('[send-quote] Drive upload failed (non-blocking)', driveErr);
      }
    }

    // 9. Enviar email al cliente con PDF adjunto
    try {
      const emailService = getEmailService();
      await emailService.sendQuote(
        quote.client_email,
        quote.client_contact_name || quote.client_name,
        quote.quote_number,
        quote.total,
        documentUrl,
        allAttachments,
        ccEmail
      );
    } catch (emailErr: unknown) {
      const errMsg = emailErr instanceof Error ? emailErr.message : 'desconocido';
      await releaseLock(`emailService.sendQuote: ${errMsg}`);
      return NextResponse.json({ error: `Error al enviar el correo: ${errMsg}` }, { status: 500 });
    }

    // 10. Marcar cotización como enviada
    const { error: updateError } = await adminClient
      .from('quotes')
      .update({
        status: 'enviada',
        ...(documentUrl ? { document_url: documentUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el estado de la cotización' }, { status: 500 });
    }

    console.log('[send-quote] Complete', { quoteId, totalMs: Date.now() - handlerStart });

    return NextResponse.json({ success: true, documentUrl });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[send-quote] Unhandled error', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
