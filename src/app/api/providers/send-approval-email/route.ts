import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/shared/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, providerId, invoiceNumber } = body;

    if (!invoiceId || !providerId || !invoiceNumber) {
      return NextResponse.json(
        { error: 'invoiceId, providerId, e invoiceNumber son requeridos' },
        { status: 400 }
      );
    }

    // Get invoice details
    const { data: invoice } = await supabase
      .from('provider_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Get provider details
    const { data: provider } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Build document links
    const documents = [
      { name: 'Cuenta de Cobro', url: invoice.document_url },
      { name: 'Documento de Identidad', url: provider.cedula_url },
      { name: 'RUT', url: provider.rut_url },
      { name: 'Cámara de Comercio', url: provider.camara_comercio_url }
    ].filter(doc => doc.url);

    // Build HTML email
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 5px; }
    .section { margin: 20px 0; }
    .label { font-weight: bold; color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
    td { padding: 10px; border: 1px solid #e5e7eb; }
    .documents { background: #f9fafb; padding: 15px; border-radius: 5px; }
    .document-link { display: block; margin: 8px 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✓ APROBACIÓN DE FACTURA/CUENTA DE COBRO</h2>
      <p>Una nueva factura ha sido aprobada para pago</p>
    </div>

    <div class="section">
      <h3>Información de la Factura</h3>
      <table>
        <tr>
          <td><span class="label">Proveedor:</span></td>
          <td>${provider.business_name}</td>
        </tr>
        <tr>
          <td><span class="label">Factura #:</span></td>
          <td>${invoiceNumber}</td>
        </tr>
        <tr>
          <td><span class="label">Monto:</span></td>
          <td>$${Number(invoice.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td><span class="label">Centro de Costo:</span></td>
          <td>${invoice.cost_center || 'N/A'}</td>
        </tr>
        <tr>
          <td><span class="label">Categoría:</span></td>
          <td>${invoice.categoria || 'N/A'}</td>
        </tr>
        <tr>
          <td><span class="label">Fecha de Aprobación:</span></td>
          <td>${new Date().toLocaleDateString('es-CO')}</td>
        </tr>
      </table>
    </div>

    ${documents.length > 0 ? `
    <div class="section">
      <h3>Documentos Adjuntos</h3>
      <div class="documents">
        ${documents.map(doc => `
          <div class="document-link">
            📄 <a href="${doc.url}" target="_blank">${doc.name}</a>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h3>Contacto del Proveedor</h3>
      <table>
        <tr>
          <td><span class="label">Email:</span></td>
          <td>${provider.contact_email || 'N/A'}</td>
        </tr>
        <tr>
          <td><span class="label">Teléfono:</span></td>
          <td>${provider.contact_phone || 'N/A'}</td>
        </tr>
        <tr>
          <td><span class="label">Ciudad:</span></td>
          <td>${provider.city || 'N/A'}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>Este es un correo automático del sistema Fonneta. Por favor no responda a este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Prepare nodemailer transporter
    console.log('Creating SMTP transporter with:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? 'set' : 'not set',
      password: process.env.SMTP_PASSWORD ? `${String(process.env.SMTP_PASSWORD).substring(0, 4)}...` : 'not set'
    });

    let transporter;

    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        logger: true,
        debug: true
      });

      // Verify transporter connection
      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log('✓ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('✗ SMTP verification failed:', {
        error: String(verifyError),
        message: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        code: verifyError instanceof Error && 'code' in verifyError ? (verifyError as any).code : undefined
      });

      throw new Error(`SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
    }

    // Send email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: 'contabilidad@fonneta.com',
      cc: process.env.ADMIN_EMAIL || 'giofonneta@gmail.com',
      subject: `Aprobación de Factura ${invoiceNumber} - ${provider.business_name}`,
      html: htmlBody
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
      response: info.response
    });

    return NextResponse.json({
      success: true,
      message: 'Correo de aprobación enviado exitosamente',
      sentTo: 'contabilidad@fonneta.com',
      invoice: {
        number: invoiceNumber,
        provider: provider.business_name,
        amount: invoice.amount
      }
    });

  } catch (error) {
    console.error('Error en send-approval-email:', error);
    return NextResponse.json(
      { error: 'Error al procesar correo de aprobación', details: String(error) },
      { status: 500 }
    );
  }
}
