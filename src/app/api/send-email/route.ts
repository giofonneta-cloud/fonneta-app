import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmailService } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/send-email',
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, invoiceId, providerId, invoiceNumber } = body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing SMTP environment variables'
        },
        { status: 500 }
      );
    }

    if (type === 'invoice-approval') {
      if (!invoiceId || !providerId || !invoiceNumber) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const adminClient = createAdminClient();

      const { data: invoice } = await adminClient
        .from('provider_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const { data: provider } = await adminClient
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;
      const fmtDate = (d: string | null) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';

      const fechaPagoEstimada = invoice.plazo_pago
        ? new Date(Date.now() + invoice.plazo_pago * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'N/A';

      const docLink = (label: string, url: string | null | undefined) =>
        url ? `<tr><td style="padding:6px 0;color:#555;width:200px">${label}</td><td style="padding:6px 0"><a href="${url}" style="color:#1a56db;text-decoration:none;font-weight:600">Ver documento</a></td></tr>` : '';

      const invoiceTypeLabel = invoice.invoice_type === 'cuenta_cobro' ? 'Cuenta de Cobro' : 'Factura';
      const isCuentaCobro = invoice.invoice_type === 'cuenta_cobro';
      const headerBg = isCuentaCobro ? '#16a34a' : '#1a56db';
      const headerLight = isCuentaCobro ? '#dcfce7' : '#dbeafe';
      const typeBadgeColor = isCuentaCobro ? '#15803d' : '#1e40af';

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f8;margin:0;padding:20px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">

    <!-- Header -->
    <div style="background:${headerBg};padding:24px 32px">
      <div style="background:${headerLight};padding:8px 12px;border-radius:6px;margin-bottom:16px;display:inline-block">
        <span style="color:${typeBadgeColor};font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:1px">${invoiceTypeLabel}</span>
      </div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900">${invoiceTypeLabel} Aprobada para Pago</h1>
      <p style="color:${isCuentaCobro ? 'rgba(255,255,255,0.85)' : '#bfdbfe'};margin:12px 0 0;font-size:14px">Radicado: <strong>${invoice.radicado_number || invoiceNumber}</strong></p>
    </div>

    <div style="padding:28px 32px">

      <!-- Tipo de Documento Destacado -->
      <div style="background:${isCuentaCobro ? '#f0fdf4' : '#f0f9ff'};border:2px solid ${isCuentaCobro ? '#22c55e' : '#0284c7'};border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;color:${isCuentaCobro ? '#166534' : '#0c4a6e'};font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px">Tipo de Documento</p>
        <p style="margin:8px 0 0 0;color:${isCuentaCobro ? '#15803d' : '#1e40af'};font-size:18px;font-weight:900">${invoiceTypeLabel}</p>
        <p style="margin:6px 0 0 0;color:${isCuentaCobro ? '#166534' : '#0c4a6e'};font-size:13px">
          ${isCuentaCobro ? 'Persona Natural - Servicios Profesionales' : 'Persona Jurídica / Empresa'}
        </p>
      </div>

      <!-- Proveedor -->
      <h2 style="font-size:15px;color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:0">Información del Proveedor</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
        <tr><td style="padding:5px 0;color:#555;width:200px">Nombre / Razón Social</td><td style="padding:5px 0;font-weight:600">${provider.business_name}</td></tr>
        ${provider.document_type && provider.document_number ? `<tr><td style="padding:5px 0;color:#555">Identificación</td><td style="padding:5px 0;font-weight:600">${provider.document_type.toUpperCase()} ${provider.document_number}</td></tr>` : ''}
        ${provider.person_type ? `<tr><td style="padding:5px 0;color:#555">Tipo de Persona</td><td style="padding:5px 0;font-weight:600">${provider.person_type === 'juridica' ? 'Persona Jurídica (Empresa)' : 'Persona Natural (Profesional/Independiente)'}</td></tr>` : ''}
        ${provider.contact_name ? `<tr><td style="padding:5px 0;color:#555">Contacto</td><td style="padding:5px 0">${provider.contact_name}</td></tr>` : ''}
        ${provider.contact_email ? `<tr><td style="padding:5px 0;color:#555">Email</td><td style="padding:5px 0">${provider.contact_email}</td></tr>` : ''}
        ${provider.contact_phone ? `<tr><td style="padding:5px 0;color:#555">Teléfono</td><td style="padding:5px 0">${provider.contact_phone}</td></tr>` : ''}
        ${provider.city ? `<tr><td style="padding:5px 0;color:#555">Ciudad</td><td style="padding:5px 0">${provider.city}${provider.department ? `, ${provider.department}` : ''}</td></tr>` : ''}
      </table>

      <!-- Detalle de la cuenta -->
      <h2 style="font-size:15px;color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px">Detalle de la ${invoiceTypeLabel}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
        <tr><td style="padding:5px 0;color:#555;width:200px">Número</td><td style="padding:5px 0;font-weight:600">${invoiceNumber}</td></tr>
        <tr><td style="padding:5px 0;color:#555">Fecha de emisión</td><td style="padding:5px 0">${fmtDate(invoice.issue_date)}</td></tr>
        <tr><td style="padding:5px 0;color:#555">Concepto</td><td style="padding:5px 0">${invoice.concept || 'N/A'}</td></tr>
        ${invoice.cost_center ? `<tr><td style="padding:5px 0;color:#555">Centro de costo</td><td style="padding:5px 0">${invoice.cost_center}</td></tr>` : ''}
        ${invoice.categoria ? `<tr><td style="padding:5px 0;color:#555">Categoría</td><td style="padding:5px 0">${invoice.categoria}</td></tr>` : ''}
      </table>

      <!-- Valores -->
      <div style="background:#f8fafc;border-radius:6px;padding:16px 20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 0;color:#555">Valor neto</td><td style="padding:4px 0;text-align:right">${fmt(invoice.valor_neto)}</td></tr>
          <tr><td style="padding:4px 0;color:#555">IVA (${invoice.iva_porcentaje}%)</td><td style="padding:4px 0;text-align:right">${fmt(invoice.iva_valor)}</td></tr>
          <tr style="border-top:2px solid #e5e7eb">
            <td style="padding:8px 0 4px;font-weight:700;font-size:16px;color:#1a56db">TOTAL</td>
            <td style="padding:8px 0 4px;text-align:right;font-weight:700;font-size:16px;color:#1a56db">${fmt(invoice.total_con_iva)}</td>
          </tr>
          <tr><td style="padding:4px 0;color:#555;font-size:13px">Plazo de pago</td><td style="padding:4px 0;text-align:right;font-size:13px">${invoice.plazo_pago} días</td></tr>
          <tr><td style="padding:4px 0;color:#555;font-size:13px">Fecha estimada de pago</td><td style="padding:4px 0;text-align:right;font-size:13px;font-weight:600;color:#059669">${fechaPagoEstimada}</td></tr>
        </table>
      </div>

      <!-- Documentos soporte -->
      <h2 style="font-size:15px;color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px">Documentos Soporte</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px">
        ${docLink(invoiceTypeLabel, invoice.document_url)}
        ${docLink('Orden de compra', invoice.orden_compra_url)}
        ${docLink('Seguridad social', invoice.seguridad_social_url)}
        ${docLink('Release', invoice.release_url)}
        ${docLink('RUT proveedor', provider.rut_url)}
        ${docLink('Cédula / Rep. Legal', provider.cedula_url)}
        ${docLink('Cámara de Comercio', provider.camara_comercio_url)}
        ${docLink('Certificado bancario', provider.cert_bancaria_url)}
      </table>

    </div>

    <!-- Footer -->
    <div style="background:#f4f6f8;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af">
      Este correo fue generado automáticamente por Fonneta App al aprobar una ${invoiceTypeLabel.toLowerCase()} para pago.
    </div>
  </div>
</body>
</html>`;

      const textAlternative = `${invoiceTypeLabel} Aprobada para Pago
Radicado: ${invoice.radicado_number || invoiceNumber}

Proveedor: ${provider.business_name}
${provider.document_type && provider.document_number ? `Identificación: ${provider.document_type.toUpperCase()} ${provider.document_number}\n` : ''}${provider.contact_email ? `Email: ${provider.contact_email}\n` : ''}
Número: ${invoiceNumber}
Fecha de emisión: ${fmtDate(invoice.issue_date)}
Concepto: ${invoice.concept || 'N/A'}

Valor neto: ${fmt(invoice.valor_neto)}
IVA (${invoice.iva_porcentaje}%): ${fmt(invoice.iva_valor)}
TOTAL: ${fmt(invoice.total_con_iva)}
Plazo de pago: ${invoice.plazo_pago} días
Fecha estimada de pago: ${fechaPagoEstimada}

Este correo fue generado automáticamente por Fonneta App al aprobar una ${invoiceTypeLabel.toLowerCase()} para pago.`;

      try {
        const documentType = isCuentaCobro ? 'CUENTA DE COBRO' : 'FACTURA';
        const info = await getEmailService().sendEmail({
          to: 'contabilidad@fonneta.com',
          cc: process.env.ADMIN_EMAIL || 'giofonneta@gmail.com',
          replyTo: 'administrativo@fonneta.com',
          subject: `[${documentType}] Aprobada para Pago - ${invoiceNumber} - ${provider.business_name}`,
          html: htmlBody,
          text: textAlternative,
        });

        return NextResponse.json({
          success: true,
          message: 'Email sent successfully',
          messageId: info.messageId
        });
      } catch (smtpError) {
        return NextResponse.json(
          {
            success: false,
            error: 'SMTP Error',
            message: smtpError instanceof Error ? smtpError.message : String(smtpError)
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Request Error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
