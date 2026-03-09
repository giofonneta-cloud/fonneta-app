import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailService } from '@/lib/email/emailService';
import type { EmailAttachment } from '@/lib/email/emailService';
import { getDriveService } from '@/lib/google-drive/driveService';
import { generatePdfFromHtml } from '@/lib/pdf/generatePdf';

interface PurchaseOrderItem {
  id: string;
  descripcion: string;
  precio: number;
  order_index: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  status: string;
  total: number;
  subtotal: number;
  iva_porcentaje: number;
  iva_valor: number;
  otros_impuestos: number;
  recipient_email: string;
  recipient_name: string;
  recipient_nit: string | null;
  recipient_address: string | null;
  recipient_city: string | null;
  recipient_phone: string | null;
  authorized_by: string | null;
  cost_center: string | null;
  transport: string | null;
  description: string | null;
  provider_id: string | null;
  sent_at: string | null;
  document_url: string | null;
  created_at: string;
  purchase_order_items: PurchaseOrderItem[];
  providers: { business_name: string } | null;
}

// ─── Logo Base64 (Fonneta) ───────────────────────────────────────────────────
const FONNETA_LOGO_B64 = 'data:image/png;base64,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';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.substring(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function generatePoHtml(po: PurchaseOrder, providerName: string): string {
  const sortedItems = [...po.purchase_order_items].sort(
    (a, b) => a.order_index - b.order_index
  );

  const itemRows = sortedItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.descripcion}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.precio)}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Orden de Compra ${po.po_number}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 14px; font-weight: 600; }
    .header { display: flex; justify-content: space-between; margin-bottom: 32px; align-items: flex-start; }
    .logo { height: 48px; margin-bottom: 8px; }
    .company-info { font-size: 11px; color: #6b7280; line-height: 1.5; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead { background-color: #f3f4f6; }
    th { padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
    th:last-child { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.total { font-weight: 700; font-size: 16px; border-top: 2px solid #111827; margin-top: 4px; padding-top: 8px; }
    .notes { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #374151; }
    .footer { margin-top: 48px; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <img src="${FONNETA_LOGO_B64}" alt="Fonneta" class="logo" />
      <h1>Orden de Compra</h1>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #6366f1;">${po.po_number}</p>
      <div class="company-info" style="margin-top: 8px;">
        Fonneta Comunicaciones S.A.S.<br/>
        NIT 901.362.051-7<br/>
        Calle 93 No. 14-17 Of. 501, Bogota D.C.<br/>
        Tel: (601) 744 7677
      </div>
    </div>
    <div style="text-align: right;">
      <p class="label">Fecha de emision</p>
      <p class="value">${formatDate(po.created_at)}</p>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <p class="label">Proveedor</p>
      <p class="value">${providerName}</p>
      ${po.recipient_nit ? `<p style="font-size: 12px; color: #6b7280; margin: 2px 0 0;">NIT: ${po.recipient_nit}</p>` : ''}
      ${po.recipient_address ? `<p style="font-size: 12px; color: #6b7280; margin: 2px 0 0;">${po.recipient_address}${po.recipient_city ? `, ${po.recipient_city}` : ''}</p>` : ''}
      ${po.recipient_phone ? `<p style="font-size: 12px; color: #6b7280; margin: 2px 0 0;">Tel: ${po.recipient_phone}</p>` : ''}
    </div>
    <div>
      <p class="label">Destinatario</p>
      <p class="value">${po.recipient_name}</p>
      <p style="font-size: 13px; color: #6b7280; margin: 2px 0 0;">${po.recipient_email}</p>
    </div>
  </div>

  ${po.authorized_by || po.cost_center || po.transport ? `
  <div class="meta-grid" style="margin-bottom: 16px;">
    ${po.authorized_by ? `<div><p class="label">Autorizado por</p><p class="value">${po.authorized_by}</p></div>` : ''}
    ${po.cost_center ? `<div><p class="label">Centro de Costo</p><p class="value">${po.cost_center}</p></div>` : ''}
    ${po.transport ? `<div><p class="label">Transporte</p><p class="value">${po.transport}</p></div>` : ''}
  </div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Descripcion</th>
        <th>Precio</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${formatCurrency(po.subtotal)}</span>
    </div>
    ${po.iva_porcentaje > 0 ? `
    <div class="totals-row">
      <span>IVA (${po.iva_porcentaje}%)</span>
      <span>${formatCurrency(po.iva_valor)}</span>
    </div>` : ''}
    ${po.otros_impuestos > 0 ? `
    <div class="totals-row">
      <span>Otros impuestos</span>
      <span>${formatCurrency(po.otros_impuestos)}</span>
    </div>` : ''}
    <div class="totals-row total">
      <span>Total</span>
      <span>${formatCurrency(po.total)}</span>
    </div>
  </div>

  ${po.description ? `
  <div style="margin-top: 32px;">
    <p class="label" style="margin-bottom: 6px;">Notas</p>
    <div class="notes">${po.description}</div>
  </div>` : ''}

  <div class="footer">
    <p>Este documento fue generado automaticamente por Fonneta. OC ${po.po_number}</p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // 2. Parsear body (soporta JSON y FormData para adjuntos)
    let purchaseOrderId: string;
    const emailAttachments: EmailAttachment[] = [];

    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      purchaseOrderId = formData.get('purchaseOrderId') as string;

      const files = formData.getAll('attachments') as File[];
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        emailAttachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type,
        });
      }
    } else {
      const body = await request.json();
      purchaseOrderId = body.purchaseOrderId;
    }

    if (!purchaseOrderId) {
      return NextResponse.json(
        { error: 'purchaseOrderId es requerido' },
        { status: 400 }
      );
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
    if (!allowedStatuses.includes((po as PurchaseOrder).status)) {
      return NextResponse.json(
        { error: `No se puede enviar la orden de compra (estado: ${(po as PurchaseOrder).status})` },
        { status: 409 }
      );
    }

    const purchaseOrder = po as PurchaseOrder;
    const providerName = purchaseOrder.providers?.business_name ?? 'Proveedor';

    // 5. Generar HTML del documento
    const htmlContent = generatePoHtml(purchaseOrder, providerName);

    // 6. Generar PDF desde el HTML
    const pdfBuffer = await generatePdfFromHtml(htmlContent);
    const pdfFilename = `OC_${purchaseOrder.po_number}.pdf`;

    // 7. Adjuntar PDF al email
    emailAttachments.push({
      filename: pdfFilename,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });

    // 8. Subir PDF a Google Drive (no bloqueante)
    let documentUrl: string | undefined;
    if (purchaseOrder.provider_id) {
      try {
        const driveService = getDriveService();
        const folders = await driveService.getOrCreateProviderFolders(
          purchaseOrder.provider_id,
          providerName
        );
        const result = await driveService.uploadFile(
          pdfBuffer,
          pdfFilename,
          'application/pdf',
          folders.documentsFolder
        );
        documentUrl = result.webViewLink;
      } catch (driveErr) {
        console.error('Drive upload failed (non-blocking):', driveErr);
      }
    }

    // 9. Enviar email al proveedor con PDF adjunto
    const emailService = getEmailService();
    await emailService.sendPurchaseOrder(
      purchaseOrder.recipient_email,
      purchaseOrder.recipient_name,
      purchaseOrder.po_number,
      purchaseOrder.total,
      documentUrl,
      emailAttachments
    );

    // 10. Marcar OC como enviada
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'enviada',
        sent_at: new Date().toISOString(),
        ...(documentUrl ? { document_url: documentUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchaseOrderId);

    if (updateError) {
      console.error('Error updating purchase order status:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el estado de la orden de compra' },
        { status: 500 }
      );
    }

    // 11. Respuesta exitosa
    return NextResponse.json({ success: true, documentUrl });
  } catch (error) {
    console.error('Error sending purchase order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
