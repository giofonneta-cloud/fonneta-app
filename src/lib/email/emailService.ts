import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP configuration environment variables are required');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        // No fallar en certificados inválidos
        rejectUnauthorized: false,
      },
    });

    this.fromEmail = process.env.NOTIFICATION_FROM_EMAIL || process.env.SMTP_USER;
    this.fromName = process.env.NOTIFICATION_FROM_NAME || 'Fonneta';
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Notificar al proveedor que su documento fue cargado exitosamente
   */
  async sendProviderDocumentUploaded(
    providerEmail: string,
    providerName: string,
    documentType: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Documento Cargado Exitosamente</h2>
        <p>Hola <strong>${providerName}</strong>,</p>
        <p>Tu documento <strong>${documentType}</strong> ha sido cargado exitosamente y está en revisión.</p>
        <p>Te notificaremos cuando haya sido validado por nuestro equipo.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Este es un mensaje automático de Fonneta. Por favor no respondas a este correo.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: providerEmail,
      subject: `Documento ${documentType} cargado exitosamente`,
      html,
      text: `Hola ${providerName}, tu documento ${documentType} ha sido cargado exitosamente y está en revisión.`,
    });
  }

  /**
   * Notificar al admin que hay un nuevo documento para revisar
   */
  async sendAdminDocumentReview(
    documentUrl: string,
    providerName: string,
    documentType: string
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.fromEmail;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nuevo Documento para Revisar</h2>
        <p>El proveedor <strong>${providerName}</strong> ha cargado un nuevo documento:</p>
        <ul>
          <li><strong>Tipo:</strong> ${documentType}</li>
          <li><strong>Proveedor:</strong> ${providerName}</li>
        </ul>
        <p>
          <a href="${documentUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Ver Documento
          </a>
        </p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Sistema de Gestión Fonneta
        </p>
      </div>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `Nuevo documento de ${providerName} - ${documentType}`,
      html,
      text: `El proveedor ${providerName} ha cargado un nuevo documento (${documentType}). Ver: ${documentUrl}`,
    });
  }

  /**
   * Notificar al proveedor que su factura fue registrada exitosamente
   * Email consolidado con toda la información y documentos asociados
   */
  async sendProviderInvoiceReceived(
    providerEmail: string,
    providerName: string,
    invoiceNumber: string,
    radicado: string,
    invoiceType: 'factura' | 'cuenta_cobro',
    amount: number,
    concept: string,
    documents: { name: string; uploaded: boolean }[]
  ): Promise<void> {
    const tipoDocumento = invoiceType === 'factura' ? 'Factura' : 'Cuenta de Cobro';
    const formattedAmount = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);

    // Lista de documentos adjuntos
    const documentsList = documents
      .filter(d => d.uploaded)
      .map(d => `<li style="margin: 5px 0;">✓ ${d.name}</li>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Confirmación de Radicación</h2>
        <p>Hola <strong>${providerName}</strong>,</p>
        <p>Tu ${tipoDocumento.toLowerCase()} ha sido radicada exitosamente en nuestro sistema.</p>

        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #1e40af;">
            Número de Radicado: ${radicado}
          </p>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            Guarda este número para futuras consultas
          </p>
        </div>

        <h3 style="color: #374151; margin-top: 25px;">Información del Documento</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Tipo:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${tipoDocumento}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Número:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Monto:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Concepto:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${concept}</td>
          </tr>
        </table>

        <h3 style="color: #374151; margin-top: 25px;">Documentos Adjuntos</h3>
        <ul style="list-style: none; padding: 0; margin: 10px 0; color: #059669;">
          ${documentsList}
        </ul>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Estado:</strong> En revisión por el equipo administrativo.
            Te notificaremos cuando haya actualizaciones.
          </p>
        </div>

        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Este es un mensaje automático de Fonneta. Por favor no respondas a este correo.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: providerEmail,
      subject: `Radicado ${radicado} - ${tipoDocumento} ${invoiceNumber} recibida`,
      html,
      text: `Hola ${providerName}, tu ${tipoDocumento.toLowerCase()} ${invoiceNumber} ha sido radicada exitosamente. Número de radicado: ${radicado}. Monto: ${formattedAmount}.`,
    });
  }

  /**
   * Notificar al admin sobre nueva factura radicada
   */
  async sendAdminInvoiceReview(
    providerName: string,
    invoiceNumber: string,
    radicado: string,
    invoiceType: 'factura' | 'cuenta_cobro',
    amount: number,
    concept: string,
    documents: { name: string; uploaded: boolean }[]
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || this.fromEmail;
    const tipoDocumento = invoiceType === 'factura' ? 'Factura' : 'Cuenta de Cobro';
    const formattedAmount = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);

    const documentsList = documents
      .filter(d => d.uploaded)
      .map(d => `<li style="margin: 5px 0;">✓ ${d.name}</li>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Nueva ${tipoDocumento} Radicada</h2>
        <p>El proveedor <strong>${providerName}</strong> ha radicado un nuevo documento para revisión.</p>

        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #991b1b;">
            Radicado: ${radicado}
          </p>
        </div>

        <h3 style="color: #374151;">Detalles</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Proveedor:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${providerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Tipo:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${tipoDocumento}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Número:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Monto:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #059669;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Concepto:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${concept}</td>
          </tr>
        </table>

        <h3 style="color: #374151; margin-top: 20px;">Documentos Adjuntos</h3>
        <ul style="list-style: none; padding: 0; margin: 10px 0; color: #059669;">
          ${documentsList}
        </ul>

        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/providers/invoices"
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Revisar en el Sistema
          </a>
        </p>

        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Sistema de Gestión Fonneta
        </p>
      </div>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `[RADICADO ${radicado}] Nueva ${tipoDocumento} de ${providerName}`,
      html,
      text: `Nueva ${tipoDocumento.toLowerCase()} radicada. Radicado: ${radicado}. Proveedor: ${providerName}. Número: ${invoiceNumber}. Monto: ${formattedAmount}.`,
    });
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
