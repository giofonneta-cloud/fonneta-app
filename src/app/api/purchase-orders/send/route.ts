export const maxDuration = 60; // Permitir hasta 60s en Vercel (Chromium es lento)

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
        Carrera 6 #123A-74, Bogota D.C.<br/>
        Cel: 318 254 4377
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

  <div class="meta-grid" style="margin-bottom: 16px;">
    ${po.authorized_by ? `<div><p class="label">Autorizado por</p><p class="value">${po.authorized_by}</p></div>` : ''}
    ${po.cost_center ? `<div><p class="label">Centro de Costo</p><p class="value">${po.cost_center}</p></div>` : ''}
    ${po.transport ? `<div><p class="label">Transporte</p><p class="value">${po.transport}</p></div>` : ''}
    <div style="grid-column: 1 / -1;">
      <p class="label">Forma de pago</p>
      <p class="value">30 días calendario desde la radicación exitosa en Fonnetapp</p>
    </div>
  </div>

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

  <!-- Página 2: Términos y Condiciones + Instrucciones de Facturación -->
  <div style="page-break-before: always; max-width:800px; margin:0 auto; padding:40px; font-size:9px; line-height:1.5; color:#111827;">
    <div style="text-align:center; margin-bottom:10px; padding-bottom:8px; border-bottom:2px solid #1d4ed8;">
      <div style="font-size:11px; font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.06em;">Términos y Condiciones Generales — Orden de Compra</div>
      <div style="font-size:9px; color:#6b7280; margin-top:2px;">Fonneta Comunicaciones S.A.S. &middot; NIT 901.362.051-7</div>
    </div>
    <p style="margin-bottom:6px; color:#374151;">Las presentes Condiciones Generales serán aplicables a todas las Órdenes de Compra expedidas por <strong>Fonneta Comunicaciones S.A.S.</strong></p>

    <div style="column-count:2; column-gap:16px; column-rule:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">1. Definiciones.</strong> (i) <em>La Compañía:</em> Fonneta Comunicaciones S.A.S., persona jurídica contratante. (ii) <em>Proveedor:</em> persona natural o jurídica identificada como tal en la Orden de Compra. (iii) <em>Bienes:</em> elementos a adquirir según lo descrito en la OC y aceptado por la Compañía. (iv) <em>Servicios:</em> prestación a cargo del Proveedor según lo descrito en la OC y aceptado por la Compañía. (v) <em>Orden de Compra:</em> documento suscrito por representante autorizado de la Compañía, al cual se incorporan estas Condiciones Generales y la oferta del Proveedor.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">2. Entrega de Bienes o Servicios.</strong> El Proveedor deberá entregar o prestar los Bienes o Servicios en las condiciones y especificaciones técnicas establecidas en la Orden de Compra, siendo de obligatorio cumplimiento al momento de su aceptación.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">3. Precio y forma de pago.</strong> El valor es el expresamente establecido en la OC. La Compañía aplicará las retenciones o deducciones de ley. El pago está sujeto a la correcta y oportuna presentación de las facturas debidamente aprobadas por el representante de la Compañía.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">4. Proveedor independiente.</strong> El Proveedor obra como contratista independiente, no como empleado, agente o representante de la Compañía. Actuará con plena autonomía profesional, técnica y administrativa.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">5. Cesión y subcontratación.</strong> El Proveedor no podrá ceder ni subcontratar total o parcialmente la ejecución de la OC sin autorización previa y escrita de la Compañía.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">6. Propiedad intelectual.</strong> Todos los derechos patrimoniales de autor, imagen o conexos derivados de obras, fonogramas, videogramas o transmisiones elaboradas en cumplimiento de esta OC (EL MATERIAL) son transferidos a la Compañía desde su creación. La Compañía tendrá derechos exclusivos de reproducción, distribución, transformación, comunicación pública, licenciamiento e importación/exportación a nivel mundial y por toda la vigencia de la protección. El Proveedor garantiza que posee todas las autorizaciones necesarias sobre obras preexistentes o propiedad industrial que incorpore, manteniendo a la Compañía indemne frente a cualquier reclamación de terceros.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">7. Terminación.</strong> La OC termina por vencimiento del término o cumplimiento de su objeto. La Compañía podrá terminarla unilateralmente con 15 días de preaviso escrito, o de manera inmediata si el Proveedor: (a) suministra datos falsos; (b) es objeto de condena o investigación penal; (c) incurre en insolvencia; (d) incumple las obligaciones de la OC o la ley; (e) realiza actos ilícitos que afecten el buen nombre de la Compañía.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">8. Indemnidad.</strong> Los daños causados por el Proveedor, su personal o subcontratistas a terceros o a la Compañía serán reconocidos y pagados por el Proveedor. Este se obliga a resarcir, defender y amparar a la Compañía de cualquier responsabilidad derivada de la OC, autorizando la retención de pagos pendientes para cubrir dichos valores.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">9. Obligaciones del Proveedor.</strong> El Proveedor se compromete a: (a) Cumplir oportuna y eficientemente el objeto contratado. (b) Garantizar el cumplimiento de la normativa vigente. (c) Responder por fallas, faltantes y daños derivados de la prestación del servicio. (d) Asumir la defensa legal y costas en procesos judiciales originados en la ejecución de la OC. (e) Habeas data: autoriza a Fonneta Comunicaciones S.A.S. para consultar y reportar información en bases de datos de riesgo financiero, crediticio, LAFT y tratamiento de datos personales conforme a la política de la Compañía. (f) Declara bajo la gravedad de juramento que los recursos vinculados a esta OC son de origen lícito y no están relacionados con lavado de activos.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">10. Confidencialidad.</strong> Toda información técnica, jurídica, financiera, comercial o estratégica de la Compañía y sus clientes que el Proveedor conozca en virtud de esta OC es confidencial. No podrá ser revelada a terceros ni usada para fines distintos a la ejecución de la OC, salvo orden de autoridad competente.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">11. Actividad lícita y anticorrupción.</strong> El Proveedor declara que ni él ni sus socios, representantes o vinculados tienen relación con actividades prohibidas o delictivas. Conoce y adhiere al programa de transparencia y ética empresarial (PTEE) de la Compañía y a la política para la gestión del riesgo de corrupción, soborno, fraude y extorsión.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">12. Territorio.</strong> El único territorio y jurisdicción aplicable a esta OC es la ciudad de Bogotá D.C., Colombia. El Proveedor renuncia a cualquier otro fuero determinado por factor de territorio.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">13. Notificaciones.</strong> (a) Línea ética y denuncias: <strong>administrativo@fonneta.com</strong> (canal con garantía de reserva). (b) Asuntos legales: <strong>administrativo@fonneta.com</strong>.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">14. Legalidad de herramientas, licencias y software.</strong> El Proveedor declara bajo la gravedad de juramento, en los términos del artículo 95 del Código de Procedimiento Civil y las Leyes 23 de 1982, 44 de 1993 y 603 de 2000, que la totalidad de herramientas, aplicaciones, plataformas, licencias y software utilizados para la prestación de los servicios objeto de la presente Orden de Compra han sido adquiridos, instalados y utilizados en estricto cumplimiento de la legislación colombiana vigente y de la Decisión Andina 351 de 1993. En consecuencia, el Proveedor se obliga a: (a) Acreditar, cuando La Compañía lo solicite y en el plazo que esta señale, los certificados de licenciamiento, contratos de uso o cualquier documentación que soporte la legalidad de las herramientas empleadas. (b) Responder de manera exclusiva y directa por cualquier reclamación, sanción, multa, proceso penal o perjuicio derivado del uso de software sin licencia, herramientas pirateadas o cuya utilización infrinja derechos de propiedad intelectual o industrial de terceros, incluyendo el pago de costas judiciales y honorarios de abogados. (c) Mantener indemne a La Compañía frente a toda acción judicial, administrativa o extrajudicial originada en el incumplimiento de esta obligación. El incumplimiento comprobado de la presente cláusula faculta a La Compañía para terminar de manera inmediata la Orden de Compra, sin perjuicio de las acciones civiles y penales a que haya lugar conforme al Código Penal colombiano (Ley 599 de 2000, art. 271 y ss.) y demás normas concordantes.</p>
    </div>

    <div style="margin-top:10px; padding-top:8px; border-top:2px solid #1d4ed8;">
      <div style="font-size:10px; font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">Instrucciones de Facturación y Radicación</div>
      <div style="column-count:2; column-gap:16px;">
        <div>
          <p style="margin:0 0 3px;"><strong>Datos de facturación:</strong> Todo documento debe ser emitido a nombre de <strong>FONNETA COMUNICACIONES SAS</strong>, NIT <strong>901.362.051-7</strong>.</p>
          <p style="margin:0 0 3px;"><strong>Requisitos del documento (Factura o Cuenta de Cobro):</strong> Debe incluir número de OC, descripción del servicio, valor total en números y letras, información bancaria completa y firma del emisor.</p>
          <p style="margin:0;"><strong>Documentación soporte:</strong> Certificado de aportes a seguridad social del mes del servicio. Release firmado si fue solicitado.</p>
        </div>
        <div>
          <p style="margin:0 0 3px;"><strong>Canal único de radicación:</strong> Exclusivamente a través de <strong>Fonnetapp</strong>. No se aceptan documentos por otros medios ni con información incompleta.</p>
          <p style="margin:0 0 3px;"><strong>Condiciones de pago:</strong> 30 días calendario desde la radicación exitosa en la plataforma.</p>
          <p style="margin:0;"><strong>Contacto:</strong> administrativo@fonneta.com</p>
        </div>
      </div>
    </div>
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

    let ccEmail: string | undefined;

    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      purchaseOrderId = formData.get('purchaseOrderId') as string;
      const rawCc = formData.get('ccEmail');
      if (rawCc && typeof rawCc === 'string' && rawCc.trim()) {
        ccEmail = rawCc.trim();
      }

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
      if (body.ccEmail && typeof body.ccEmail === 'string' && body.ccEmail.trim()) {
        ccEmail = body.ccEmail.trim();
      }
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

    // 4.5. Mutex atómico: reservar sent_at ANTES de generar el PDF
    // Previene doble-envío si el usuario hace clic dos veces o hay reintento de red.
    // Solo permite enviar si sent_at es null o lleva más de 10 segundos (suficiente para detectar dobles clics).
    // Si el envío falla, hacemos rollback de sent_at a null para no dejar la OC bloqueada.
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
      // Diagnóstico: verificar si el lock falló por estado o por sent_at reciente
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
      (po as PurchaseOrder).sent_at &&
      (po as PurchaseOrder).sent_at !== sentAtNow
        ? (po as PurchaseOrder).sent_at
        : null;

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

    const purchaseOrder = po as PurchaseOrder;
    const providerName = purchaseOrder.providers?.business_name ?? 'Proveedor';

    // 5. Generar HTML del documento
    let htmlContent: string;
    try {
      htmlContent = generatePoHtml(purchaseOrder, providerName);
    } catch (htmlErr: any) {
      await releaseLock(`generatePoHtml: ${htmlErr?.message}`);
      console.error('[send-po] HTML generation failed', htmlErr);
      return NextResponse.json(
        { error: 'Error al generar el documento HTML de la orden' },
        { status: 500 }
      );
    }

    // 6. Generar PDF desde el HTML
    let pdfBuffer: Buffer;
    const pdfFilename = `OC_${purchaseOrder.po_number}.pdf`;
    const pdfStart = Date.now();
    try {
      pdfBuffer = await generatePdfFromHtml(htmlContent);
      console.log('[send-po] PDF generated', {
        purchaseOrderId,
        ms: Date.now() - pdfStart,
        size: pdfBuffer.length,
      });
    } catch (pdfErr: any) {
      await releaseLock(`generatePdfFromHtml: ${pdfErr?.message}`);
      console.error('[send-po] PDF generation failed', {
        purchaseOrderId,
        ms: Date.now() - pdfStart,
        error: pdfErr,
      });
      return NextResponse.json(
        { error: `Error al generar el PDF: ${pdfErr?.message ?? 'desconocido'}` },
        { status: 500 }
      );
    }

    // 7. Adjuntar PDF al email (siempre primero; filtrar duplicados del usuario con el mismo nombre)
    const allAttachments: EmailAttachment[] = [
      { filename: pdfFilename, content: pdfBuffer, contentType: 'application/pdf' },
      ...emailAttachments.filter((a) => a.filename !== pdfFilename),
    ];

    // 8. Subir PDF a Google Drive (no bloqueante)
    let documentUrl: string | undefined;
    if (purchaseOrder.provider_id) {
      const driveStart = Date.now();
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

    // 9. Enviar email al proveedor con PDF adjunto
    const emailStart = Date.now();
    try {
      const emailService = getEmailService();
      await emailService.sendPurchaseOrder(
        purchaseOrder.recipient_email,
        purchaseOrder.recipient_name,
        purchaseOrder.po_number,
        purchaseOrder.total,
        documentUrl,
        allAttachments,
        ccEmail
      );
      console.log('[send-po] Email sent OK', {
        purchaseOrderId,
        recipient: purchaseOrder.recipient_email,
        ccEmail,
        ms: Date.now() - emailStart,
      });
    } catch (emailErr: any) {
      await releaseLock(`emailService.sendPurchaseOrder: ${emailErr?.message}`);
      console.error('[send-po] Email send failed', {
        purchaseOrderId,
        recipient: purchaseOrder.recipient_email,
        ms: Date.now() - emailStart,
        error: emailErr,
      });
      return NextResponse.json(
        { error: `Error al enviar el correo: ${emailErr?.message ?? 'desconocido'}` },
        { status: 500 }
      );
    }

    // 10. Marcar OC como enviada (sent_at ya fue establecido en el paso 4.5)
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

    // 11. Respuesta exitosa
    return NextResponse.json({ success: true, documentUrl });
  } catch (error: any) {
    console.error('[send-po] Unhandled error', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor detallado' },
      { status: 500 }
    );
  }
}
