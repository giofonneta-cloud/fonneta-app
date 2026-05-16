import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/shared/lib/supabase';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, invoiceId, providerId, invoiceNumber } = body;

    // Verificar vars de entorno
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Missing SMTP environment variables' },
        { status: 500 }
      );
    }

    if (type === 'invoice-approval') {
      if (!invoiceId || !providerId || !invoiceNumber) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Get invoice
      const { data: invoice } = await supabase
        .from('provider_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Get provider
      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      // Build HTML
      const htmlBody = `
        <h2>Aprobación de Factura</h2>
        <p><strong>Proveedor:</strong> ${provider.business_name}</p>
        <p><strong>Factura #:</strong> ${invoiceNumber}</p>
        <p><strong>Monto:</strong> $${Number(invoice.amount).toLocaleString('es-CO')}</p>
      `;

      // Send email
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: 'contabilidad@fonneta.com',
          cc: process.env.ADMIN_EMAIL || 'giofonneta@gmail.com',
          subject: `Aprobación de Factura ${invoiceNumber} - ${provider.business_name}`,
          html: htmlBody
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
