export const maxDuration = 30; // Ya no necesita 60s sin Chromium

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailService } from '@/lib/email/emailService';
import type { EmailAttachment } from '@/lib/email/emailService';
import { getDriveService } from '@/lib/google-drive/driveService';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const handlerStart = Date.now();
  console.log('[send-po] Handler invoked', {
    method: request.method,
    contentType: request.headers.get('content-type'),
    nodeEnv: process.env.NODE_ENV,
    memoryUsage: process.memoryUsage().rss,
  });
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

    // 2. Parsear body — siempre llega como FormData (PDF del cliente + adjuntos opcionales)
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Se requiere multipart/form-data con el PDF de la OC' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const purchaseOrderId = formData.get('purchaseOrderId') as string;
    const pdfFile = formData.get('pdfFile') as File | null;
    const rawCc = formData.get('ccEmail');
    const ccEmail =
      rawCc && typeof rawCc === 'string' && rawCc.trim() ? rawCc.trim() : undefined;

    if (!purchaseOrderId) {
      return NextResponse.json(
        { error: 'purchaseOrderId es requerido' },
        { status: 400 }
      );
    }

    if (!pdfFile || pdfFile.size === 0) {
      return NextResponse.json(
        { error: 'pdfFile es requerido (PDF generado en el cliente)' },
        { status: 400 }
      );
    }

    // Leer el PDF del cliente a un Buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    console.log('[send-po] PDF received from client', {
      purchaseOrderId,
      size: pdfBuffer.length,
      ms: Date.now() - handlerStart,
    });

    // Adjuntos adicionales del usuario
    const emailAttachments: EmailAttachment[] = [];
    const files = formData.getAll('attachments') as File[];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      emailAttachments.push({
        filename: file.name,
        content: buffer,
        contentType: file.type,
      });
    }

    // 3. Obtener OC con items y proveedor
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`*, purchase_order_items (*), providers:provider_id (business_name)`)
      .eq('id', purchaseOrderId)
      .single();

    if (poError || !po) {
      return NextResponse.json(
        { error: 'Orden de compra no encontrada' },
        { status: 404 }
      );
    }

    // 4. Validar que el estado permita envio (borrador o enviada para reenvio)
    const allowedStatuses = ['borrador', 'enviada'];
    if (!allowedStatuses.includes(po.status)) {
      return NextResponse.json(
        { error: `No se puede enviar la orden de compra (estado: ${po.status})` },
        { status: 409 }
      );
    }

    // 4.5. Mutex atómico: reservar sent_at ANTES de enviar
    // Previene doble-envío si el usuario hace clic dos veces o hay reintento de red.
    const SEND_COOLDOWN_MS = 10_000;
    const cooldownCutoff = new Date(Date.now() - SEND_COOLDOWN_MS).toISOString();
    const sentAtNow = new Date().toISOString();

    const { data: lockData } = await supabase
      .from('purchase_orders')
      .update({ sent_at: sentAtNow, updated_at: sentAtNow })
      .eq('id', purchaseOrderId)
      .in('status', allowedStatuses)
      .or(`sent_at.is.null,sent_at.lt.${cooldownCutoff}`)
      .select('id, sent_at');

    if (!lockData || lockData.length === 0) {
      const { data: currentPo } = await supabase
        .from('purchase_orders')
        .select('status, sent_at')
        .eq('id', purchaseOrderId)
        .single();
      console.warn('[send-po] Lock denied', {
        purchaseOrderId,
        currentStatus: currentPo?.status,
        currentSentAt: currentPo?.sent_at,
        cooldownCutoff,
      });
      return NextResponse.json(
        { error: 'La orden ya está siendo enviada. Espera unos segundos antes de reintentar.' },
        { status: 429 }
      );
    }

    // Captura el sent_at previo para hacer rollback si algo falla
    const previousSentAt: string | null =
      po.sent_at && po.sent_at !== sentAtNow ? po.sent_at : null;

    // Helper para liberar el lock si el envío falla.
    const releaseLock = async (reason: string) => {
      try {
        await supabase
          .from('purchase_orders')
          .update({ sent_at: previousSentAt, updated_at: new Date().toISOString() })
          .eq('id', purchaseOrderId);
        console.warn('[send-po] Lock released', { purchaseOrderId, reason });
      } catch (releaseErr) {
        console.error('[send-po] Failed to release lock', releaseErr);
      }
    };

    const providerName = po.providers?.business_name ?? 'Proveedor';
    const pdfFilename = `OC_${po.po_number}.pdf`;

    // 5. Preparar adjuntos: PDF primero + adjuntos del usuario (sin duplicados)
    const allAttachments: EmailAttachment[] = [
      { filename: pdfFilename, content: pdfBuffer, contentType: 'application/pdf' },
      ...emailAttachments.filter((a) => a.filename !== pdfFilename),
    ];

    // 6. Subir PDF a Google Drive (no bloqueante)
    let documentUrl: string | undefined;
    if (po.provider_id) {
      const driveStart = Date.now();
      try {
        const driveService = getDriveService();
        const folders = await driveService.getOrCreateProviderFolders(
          po.provider_id,
          providerName
        );
        const result = await driveService.uploadFile(
          pdfBuffer,
          pdfFilename,
          'application/pdf',
          folders.documentsFolder
        );
        documentUrl = result.webViewLink;
        console.log('[send-po] Drive upload OK', {
          purchaseOrderId,
          ms: Date.now() - driveStart,
        });
      } catch (driveErr) {
        console.error('[send-po] Drive upload failed (non-blocking)', {
          purchaseOrderId,
          ms: Date.now() - driveStart,
          error: driveErr,
        });
      }
    }

    // 7. Enviar email al proveedor con PDF adjunto
    const emailStart = Date.now();
    try {
      const emailService = getEmailService();
      await emailService.sendPurchaseOrder(
        po.recipient_email,
        po.recipient_name,
        po.po_number,
        po.total,
        documentUrl,
        allAttachments,
        ccEmail
      );
      console.log('[send-po] Email sent OK', {
        purchaseOrderId,
        recipient: po.recipient_email,
        ccEmail,
        ms: Date.now() - emailStart,
      });
    } catch (emailErr: unknown) {
      const errMsg = emailErr instanceof Error ? emailErr.message : 'desconocido';
      await releaseLock(`emailService.sendPurchaseOrder: ${errMsg}`);
      console.error('[send-po] Email send failed', {
        purchaseOrderId,
        recipient: po.recipient_email,
        ms: Date.now() - emailStart,
        error: emailErr,
      });
      return NextResponse.json(
        { error: `Error al enviar el correo: ${errMsg}` },
        { status: 500 }
      );
    }

    // 8. Marcar OC como enviada (sent_at ya fue establecido en el paso 4.5)
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'enviada',
        ...(documentUrl ? { document_url: documentUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchaseOrderId);

    if (updateError) {
      console.error('[send-po] Error updating PO status', {
        purchaseOrderId,
        error: updateError,
      });
      return NextResponse.json(
        { error: 'Error al actualizar el estado de la orden de compra' },
        { status: 500 }
      );
    }

    console.log('[send-po] Complete', {
      purchaseOrderId,
      totalMs: Date.now() - handlerStart,
    });

    // 9. Respuesta exitosa
    return NextResponse.json({ success: true, documentUrl });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('[send-po] Unhandled error', error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
